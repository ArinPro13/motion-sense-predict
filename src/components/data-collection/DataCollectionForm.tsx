
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Play, Square, Save, PlusCircle, X } from 'lucide-react';
import mqttService, { SensorData, MQTTConfig } from '@/services/mqttService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Default activities
const DEFAULT_ACTIVITIES = ['standing', 'sitting', 'walking'];

const DataCollectionForm = () => {
  const [selectedActivity, setSelectedActivity] = useState<string>('');
  const [newActivity, setNewActivity] = useState<string>('');
  const [activities, setActivities] = useState<string[]>(DEFAULT_ACTIVITIES);
  const [isCollecting, setIsCollecting] = useState<boolean>(false);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [showNewActivityInput, setShowNewActivityInput] = useState<boolean>(false);
  const chartDataRef = useRef<SensorData[]>([]);
  const { toast } = useToast();

  // Configure MQTT
  useEffect(() => {
    const config: MQTTConfig = {
      brokerUrl: 'mqtt://broker.example.com', // This would be your real MQTT broker
      clientId: `motionsense_${Date.now()}`,
      topic: 'esp32/sensor_data'
    };
    mqttService.configure(config);

    return () => {
      mqttService.disconnect();
    };
  }, []);

  // Handle received sensor data
  const handleSensorData = (data: SensorData) => {
    const updatedData = [...chartDataRef.current, data];
    
    // Limit chart data to the most recent 20 points for better visualization
    if (updatedData.length > 20) {
      chartDataRef.current = updatedData.slice(updatedData.length - 20);
    } else {
      chartDataRef.current = updatedData;
    }
    
    setSensorData([...chartDataRef.current]);
  };

  // Start data collection
  const startCollection = async () => {
    if (!selectedActivity) {
      toast({
        title: 'Error',
        description: 'Please select an activity first',
        variant: 'destructive',
      });
      return;
    }

    try {
      await mqttService.connect(handleSensorData);
      setIsCollecting(true);
      chartDataRef.current = [];
      setSensorData([]);
      toast({
        title: 'Data Collection Started',
        description: `Recording data for ${selectedActivity}`,
      });
    } catch (error) {
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to MQTT broker',
        variant: 'destructive',
      });
    }
  };

  // Stop data collection
  const stopCollection = async () => {
    await mqttService.disconnect();
    setIsCollecting(false);
    toast({
      title: 'Data Collection Stopped',
      description: `Collected ${chartDataRef.current.length} data points for ${selectedActivity}`,
    });
  };

  // Save collected data
  const saveData = () => {
    if (chartDataRef.current.length === 0) {
      toast({
        title: 'No Data',
        description: 'No data has been collected to save',
        variant: 'destructive',
      });
      return;
    }

    // In a real application, this would save the data to a server/database
    // For the demo, we'll just show a success toast
    toast({
      title: 'Data Saved',
      description: `${chartDataRef.current.length} data points saved for ${selectedActivity}`,
    });
  };

  // Add new activity
  const addNewActivity = () => {
    if (!newActivity.trim()) {
      toast({
        title: 'Invalid Activity',
        description: 'Please enter a valid activity name',
        variant: 'destructive',
      });
      return;
    }

    if (activities.includes(newActivity.trim().toLowerCase())) {
      toast({
        title: 'Activity Exists',
        description: 'This activity already exists',
        variant: 'destructive',
      });
      return;
    }

    setActivities([...activities, newActivity.trim().toLowerCase()]);
    setSelectedActivity(newActivity.trim().toLowerCase());
    setNewActivity('');
    setShowNewActivityInput(false);

    toast({
      title: 'Activity Added',
      description: `'${newActivity}' has been added to available activities`,
    });
  };

  // Format data for chart
  const formatChartData = (data: SensorData[]) => {
    return data.map((item, index) => ({
      name: index,
      accX: item.acceleration.x,
      accY: item.acceleration.y,
      accZ: item.acceleration.z,
      gyroX: item.gyroscope.x,
      gyroY: item.gyroscope.y,
      gyroZ: item.gyroscope.z,
    }));
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Data Collection</CardTitle>
          <CardDescription>
            Select an activity and collect sensor data from your ESP32 device.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Select Activity</Label>
            <div className="flex items-center space-x-2">
              {showNewActivityInput ? (
                <div className="flex items-center flex-1 space-x-2">
                  <Input
                    placeholder="Enter new activity"
                    value={newActivity}
                    onChange={(e) => setNewActivity(e.target.value)}
                  />
                  <Button size="sm" onClick={addNewActivity}>Add</Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => setShowNewActivityInput(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Select 
                    value={selectedActivity} 
                    onValueChange={setSelectedActivity}
                    disabled={isCollecting}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select an activity" />
                    </SelectTrigger>
                    <SelectContent>
                      {activities.map((activity) => (
                        <SelectItem key={activity} value={activity}>
                          {activity.charAt(0).toUpperCase() + activity.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setShowNewActivityInput(true)}
                    disabled={isCollecting}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="flex space-x-2">
            {activities.map((activity) => (
              <Badge 
                key={activity} 
                variant={selectedActivity === activity ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => !isCollecting && setSelectedActivity(activity)}
              >
                {activity}
              </Badge>
            ))}
          </div>

          <div className="flex justify-between">
            <Button
              onClick={isCollecting ? stopCollection : startCollection}
              variant={isCollecting ? "destructive" : "default"}
              disabled={!selectedActivity && !isCollecting}
              className="px-4"
            >
              {isCollecting ? (
                <>
                  <Square className="mr-2 h-4 w-4" /> Stop Recording
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" /> Start Recording
                </>
              )}
            </Button>

            <Button
              onClick={saveData}
              variant="outline"
              disabled={isCollecting || chartDataRef.current.length === 0}
              className="px-4"
            >
              <Save className="mr-2 h-4 w-4" /> Save Data
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sensor Data Visualization</CardTitle>
          <CardDescription>Real-time data from accelerometer and gyroscope</CardDescription>
        </CardHeader>
        <CardContent>
          {sensorData.length > 0 ? (
            <div className="data-visualization">
              <div className="mb-8">
                <h3 className="font-semibold mb-2">Accelerometer</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={formatChartData(sensorData)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[-10, 10]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="accX" stroke="#3B82F6" name="X-Axis" />
                    <Line type="monotone" dataKey="accY" stroke="#10B981" name="Y-Axis" />
                    <Line type="monotone" dataKey="accZ" stroke="#EF4444" name="Z-Axis" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Gyroscope</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={formatChartData(sensorData)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[-10, 10]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="gyroX" stroke="#8B5CF6" name="X-Axis" />
                    <Line type="monotone" dataKey="gyroY" stroke="#F59E0B" name="Y-Axis" />
                    <Line type="monotone" dataKey="gyroZ" stroke="#EC4899" name="Z-Axis" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {isCollecting ? 
                <p>Waiting for sensor data...</p> : 
                <p>Start data collection to see visualization</p>
              }
            </div>
          )}
        </CardContent>
        <CardFooter>
          <div className="w-full text-sm text-muted-foreground">
            {isCollecting ? (
              <p>Recording data for <span className="font-medium text-primary">{selectedActivity}</span> - {sensorData.length} data points collected</p>
            ) : (
              sensorData.length > 0 ? (
                <p>Data collection paused - {sensorData.length} data points collected</p>
              ) : (
                <p>Select an activity and start recording to collect data</p>
              )
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default DataCollectionForm;
