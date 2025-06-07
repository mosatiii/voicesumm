import React, { useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';

export default function TodoScreen() {
  const [tasks, setTasks] = useState([
    { id: '1', text: 'Schedule team meeting for Friday', completed: false },
    { id: '2', text: 'Follow up with client about project timeline', completed: false },
    { id: '3', text: 'Send weekly report', completed: true },
  ]);
  const [newTask, setNewTask] = useState('');

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, { id: Date.now().toString(), text: newTask, completed: false }]);
      setNewTask('');
    }
  };

  const toggleTaskCompletion = (id) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Add a new task..."
        value={newTask}
        onChangeText={setNewTask}
      />
      <Button title="Add Task" onPress={addTask} />
      <View style={styles.taskList}>
        <Text style={styles.columnTitle}>In Progress</Text>
        <FlatList
          data={tasks.filter(task => !task.completed)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.taskItem}>
              <Text style={styles.taskText}>{item.text}</Text>
              <Button title="Complete" onPress={() => toggleTaskCompletion(item.id)} />
              <Button title="Delete" onPress={() => deleteTask(item.id)} />
            </View>
          )}
        />
        <Text style={styles.columnTitle}>Completed</Text>
        <FlatList
          data={tasks.filter(task => task.completed)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.taskItem}>
              <Text style={[styles.taskText, styles.completedTask]}>{item.text}</Text>
              <Button title="Undo" onPress={() => toggleTaskCompletion(item.id)} />
              <Button title="Delete" onPress={() => deleteTask(item.id)} />
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  taskList: {
    flex: 1,
    marginTop: 16,
  },
  columnTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: 'white',
    borderRadius: 4,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  taskText: {
    fontSize: 16,
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: 'gray',
  },
}); 