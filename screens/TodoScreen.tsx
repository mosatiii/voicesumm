import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Platform, Animated, SectionList, TouchableOpacity } from 'react-native';
import { TextInput, Text, IconButton, Surface, useTheme, Portal, Dialog, Button, TouchableRipple } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { format, isToday, isThisWeek, isThisMonth, parseISO } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
}

const PRIORITY_CONFIG = {
  low: { 
    level: 1,
    color: '#4CAF50', 
    label: 'Low'
  },
  medium: { 
    level: 2,
    color: '#FFA726', 
    label: 'Medium'
  },
  high: { 
    level: 3,
    color: '#FF4B4B', 
    label: 'High'
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statusBarTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  signInButton: {
    paddingHorizontal: 8,
  },
  signInText: {
    color: '#6B4EFF',
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#111827',
  },
  inputContainer: {
    margin: 16,
    borderRadius: 16,
    backgroundColor: 'white',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  input: {
    backgroundColor: 'white',
    marginHorizontal: 8,
    marginTop: 8,
  },
  inputOutline: {
    borderRadius: 12,
    borderColor: '#E5E7EB',
  },
  prioritySection: {
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  quickPriority: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    flexDirection: 'row',
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  bubblesRow: {
    flexDirection: 'row',
    gap: 4,
    width: 40,
    justifyContent: 'flex-start',
  },
  bubblesContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  bubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  exclamation: {
    fontSize: 14,
    fontWeight: '700',
  },
  listsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  completedTitle: {
    marginTop: 32,
    color: '#6B7280',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  taskSurface: {
    backgroundColor: 'white',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  checkButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  checkButtonCompleted: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  taskMiddle: {
    flex: 1,
    gap: 4,
  },
  taskText: {
    fontSize: 16,
    color: '#111827',
    lineHeight: 22,
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  dueDate: {
    fontSize: 13,
    color: '#6B7280',
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  editButton: {
    backgroundColor: '#F3F4F6',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  editInput: {
    backgroundColor: 'white',
    marginTop: 8,
  },
  dateButton: {
    marginTop: 16,
  },
  datePickerDialog: {
    backgroundColor: 'white',
    borderRadius: 16,
  },
  datePicker: {
    width: Platform.OS === 'ios' ? '100%' : 'auto',
    height: Platform.OS === 'ios' ? 200 : 'auto',
  },
  priorityContainer: {
    marginTop: 16,
  },
  priorityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  completedSectionHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 12,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  completedSectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
});
export default function TodoScreen() {
  const theme = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [tempPriority, setTempPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [tempTaskText, setTempTaskText] = useState('');
  const [tempDueDate, setTempDueDate] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<{ [key: string]: boolean }>({});

  const addTask = () => {
    if (newTask.trim()) {
      const task: Task = {
        id: Date.now().toString(),
        text: newTask,
        completed: false,
        createdAt: new Date(),
        priority: tempPriority,
        dueDate: tempDueDate
      };
      setTasks([task, ...tasks]);
      setNewTask('');
      setTempPriority('medium');
      setTempDueDate(undefined);
    }
  };

  const toggleTaskCompletion = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setTempTaskText(task.text);
    setTempDueDate(task.dueDate);
    setTempPriority(task.priority);
    setIsEditModalVisible(true);
  };

  const saveEditedTask = () => {
    if (editingTask && tempTaskText.trim()) {
      setTasks(tasks.map(task => 
        task.id === editingTask.id 
          ? { 
              ...task, 
              text: tempTaskText,
              dueDate: tempDueDate,
              priority: tempPriority
            } 
          : task
      ));
      setIsEditModalVisible(false);
      setEditingTask(null);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setTempDueDate(selectedDate);
    }
  };

  const sortByPriority = (tasks: Task[]) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return [...tasks].sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff === 0) {
        // If same priority, sort by creation date (newest first)
        return b.createdAt.getTime() - a.createdAt.getTime();
      }
      return priorityDiff;
    });
  };

  const groupCompletedTasks = (tasks: Task[]) => {
    const today: Task[] = [];
    const thisWeek: Task[] = [];
    const thisMonth: Task[] = [];
    const older: Task[] = [];

    tasks.forEach(task => {
      if (isToday(task.createdAt)) {
        today.push(task);
      } else if (isThisWeek(task.createdAt)) {
        thisWeek.push(task);
      } else if (isThisMonth(task.createdAt)) {
        thisMonth.push(task);
      } else {
        older.push(task);
      }
    });

    const sections = [];
    if (today.length > 0) {
      sections.push({ title: 'Today', data: sortByPriority(today) });
    }
    if (thisWeek.length > 0) {
      sections.push({ title: 'This Week', data: sortByPriority(thisWeek) });
    }
    if (thisMonth.length > 0) {
      sections.push({ title: 'This Month', data: sortByPriority(thisMonth) });
    }
    if (older.length > 0) {
      sections.push({ title: 'Older', data: sortByPriority(older) });
    }

    return sections;
  };

  const activeTasks = sortByPriority(tasks.filter(task => !task.completed));
  const completedSections = groupCompletedTasks(tasks.filter(task => task.completed));

  const toggleSection = (title: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const renderTask = ({ item }: { item: Task }) => {
    const priorityConfig = PRIORITY_CONFIG[item.priority];
    return (
      <Surface style={[
        styles.taskSurface,
        {
          borderLeftWidth: 4,
          borderLeftColor: priorityConfig.color,
        }
      ]} elevation={1}>
        <View style={styles.taskContent}>
          <TouchableOpacity 
            style={[
              styles.checkButton,
              item.completed && styles.checkButtonCompleted
            ]}
            onPress={() => toggleTaskCompletion(item.id)}
          >
            <MaterialCommunityIcons
              name={item.completed ? "check-bold" : "checkbox-blank-circle-outline"}
              size={16}
              color="white"
            />
          </TouchableOpacity>
          
          <View style={styles.taskMiddle}>
            <Text style={[styles.taskText, item.completed && styles.completedTask]} numberOfLines={2}>
              {item.text}
            </Text>
            {item.dueDate && (
              <Text style={styles.dueDate}>
                Due {format(item.dueDate, 'MMM d, h:mm a')}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => openEditModal(item)}
          >
            <MaterialCommunityIcons name="pencil" size={16} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => deleteTask(item.id)}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </Surface>
    );
  };

  const renderSectionHeader = ({ section: { title, data } }: { section: { title: string, data: Task[] } }) => (
    <TouchableOpacity 
      onPress={() => toggleSection(title)}
      style={styles.completedSectionHeader}
    >
      <View style={styles.sectionHeaderContent}>
        <Text style={styles.completedSectionTitle}>{title} ({data.length})</Text>
        <MaterialCommunityIcons
          name={collapsedSections[title] ? 'chevron-right' : 'chevron-down'}
          size={24}
          color="#666"
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      

      <Surface style={styles.inputContainer} elevation={1}>
        <TextInput
          mode="outlined"
          placeholder="What needs to be done?"
          value={newTask}
          onChangeText={setNewTask}
          style={styles.input}
          outlineStyle={styles.inputOutline}
          onSubmitEditing={addTask}
        />
        <View style={styles.prioritySection}>
          <Text style={styles.sectionTitle}>Priority</Text>
          <View style={styles.quickPriority}>
            {(Object.entries(PRIORITY_CONFIG) as [keyof typeof PRIORITY_CONFIG, typeof PRIORITY_CONFIG[keyof typeof PRIORITY_CONFIG]][]).map(([key, config]) => (
              <TouchableRipple
                key={key}
                onPress={() => setTempPriority(key)}
                style={[
                  styles.priorityButton,
                  tempPriority === key && {
                    backgroundColor: `${config.color}10`,
                    borderColor: config.color,
                  }
                ]}
              >
                <Text style={[
                  styles.priorityLabel,
                  { color: tempPriority === key ? config.color : '#6B7280' }
                ]}>
                  {config.label}
                </Text>
              </TouchableRipple>
            ))}
          </View>
        </View>
      </Surface>

      <View style={styles.listsContainer}>
        <Text style={styles.sectionTitle}>Active Tasks</Text>
        <FlatList
          data={activeTasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTask}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />

        {completedSections.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, styles.completedTitle]}>
              Completed
            </Text>
            <SectionList
              sections={completedSections}
              keyExtractor={(item) => item.id}
              renderItem={({ item, section }) => 
                collapsedSections[section.title] ? null : renderTask({ item })
              }
              renderSectionHeader={renderSectionHeader}
              style={styles.list}
              contentContainerStyle={styles.listContent}
            />
          </>
        )}
      </View>

      <Portal>
        <Dialog visible={isEditModalVisible} onDismiss={() => setIsEditModalVisible(false)}>
          <Dialog.Title>Edit Task</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              label="Task"
              value={tempTaskText}
              onChangeText={setTempTaskText}
              style={styles.editInput}
              multiline
            />
            <View style={styles.priorityContainer}>
              <Text style={styles.priorityLabel}>Priority:</Text>
              <View style={styles.priorityButtons}>
                {(Object.entries(PRIORITY_CONFIG) as [keyof typeof PRIORITY_CONFIG, typeof PRIORITY_CONFIG[keyof typeof PRIORITY_CONFIG]][]).map(([key, config]) => (
                  <TouchableRipple
                    key={key}
                    onPress={() => setTempPriority(key)}
                    style={[
                      styles.priorityButton,
                      tempPriority === key && {
                        backgroundColor: `${config.color}10`,
                        borderColor: config.color
                      }
                    ]}
                  >
                    <Text style={[
                      styles.priorityLabel,
                      { 
                        color: tempPriority === key ? config.color : '#6B7280'
                      }
                    ]}>
                      {config.label}
                    </Text>
                  </TouchableRipple>
                ))}
              </View>
            </View>
            <Button
              onPress={() => setShowDatePicker(true)}
              style={styles.dateButton}
              mode="outlined"
            >
              {tempDueDate ? format(tempDueDate, 'MMM d, yyyy HH:mm') : 'Set due date'}
            </Button>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setIsEditModalVisible(false)}>Cancel</Button>
            <Button onPress={saveEditedTask} mode="contained">Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {showDatePicker && (
        <Portal>
          <Dialog visible={showDatePicker} onDismiss={() => setShowDatePicker(false)} style={styles.datePickerDialog}>
            <Dialog.Content>
              <DateTimePicker
                value={tempDueDate || new Date()}
                mode="datetime"
                onChange={onDateChange}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                style={styles.datePicker}
              />
            </Dialog.Content>
            {Platform.OS === 'ios' && (
              <Dialog.Actions>
                <Button onPress={() => setShowDatePicker(false)}>Done</Button>
              </Dialog.Actions>
            )}
          </Dialog>
        </Portal>
      )}
    </View>
  );
}
