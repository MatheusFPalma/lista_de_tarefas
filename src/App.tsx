
import * as Component from './App.styles'
import { Area } from './components/Area'
import ButtonDefault from './components/Button/ButtonDefault';
import DeleteIcon from '@mui/icons-material/Delete';
import { Alert, Button, IconButton, Snackbar, TextField } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { v4 as uuidv4 } from 'uuid';



import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ItemType } from './types/ItemType';
import { ItemStyled } from './components/ListItem/styles';
import BasicModal from './components/Modal';
import DialogConfirm from './components/DailogConfirm';
import AlertStyled from './components/AlertStyled';

const API_BASE_URL = 'http://localhost:3000';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<ItemType[]>([]);
  const [filter, setFilter] = useState<string>('Todas');
  const [inputText, setInputText] = useState<string>('')
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [taskModal, setTaskModal] = useState<string>('');
  const [editModal, setEditModal] = useState<boolean>(false);
  const [editTask, setEditTask] = useState<ItemType | undefined>();
  const [taskDelete, setTaskDelete] = useState<ItemType | undefined>()
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false)
  const [openAlert, setOpenAlert] = useState<boolean>(false)

  const fetchTasks = useCallback(() => {
    fetch(`${API_BASE_URL}/tasks`)
      .then(response => response.json())
      .then(data => setTasks(data))
      .catch(error => {
        console.error('Erro ao buscar tarefas:', error);
      });
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = useCallback((name: string) => {
    const newTask: ItemType = {
      id: uuidv4(),
      name,
      done: false,
    };
  
    fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newTask),
    }).then(response => {
      if (response.ok) {
        setInputText('');
      }
    });
  }, []);
  


  const editListTask = () => {
    const editListTask = [...tasks];
    const index = editListTask.findIndex(item => item.id == editTask?.id);

    editListTask[index].name = taskModal;
    if (taskModal.length < 5) {
      return alert('Por favor digite uma descrição com no mínio 5 caractéres')
    }
    fetch(`${API_BASE_URL}/tasks/${editTask?.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: taskModal }),
    }).then(response => {
      if (response.ok) {
        setTasks(editListTask);
        setEditModal(false);
      }
    });
  };

  const deleteListTask = () => {
    const index = tasks.findIndex(item => item.id === taskDelete?.id);
    const deleteTask = [...tasks];
    deleteTask.splice(index, 1);
  
    fetch(`${API_BASE_URL}/tasks/${taskDelete?.id}`, {
      method: 'DELETE',
    }).then(response => {
      if (response.ok) {
        setTasks(deleteTask);
        setOpenDeleteDialog(false);
        handleCloseAlert();
      }
    });
  };

  const filteredTasks = useMemo(() => {
    if (filter === 'done') {
      return tasks.filter(task => task.done);
    } else if (filter === 'Pendentes') {
      return tasks.filter(task => !task.done);
    } else {
      return tasks;
    }
  }, [tasks, filter]);

  const toggleTask = useCallback((taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, done: !task.done } : task
      )
    );
  }, []);

  useEffect(() => {
    if (inputRef.current) {
      setInputText(inputText)
      console.log('Input value:', inputRef.current.value);
    }
  }, [inputText]);

  const openEditModal = (itemEdit: ItemType) => {
    setEditTask(itemEdit);
    setEditModal(true);
  };

  const openDeleteTask = (itemDelete: ItemType) => {
    setTaskDelete(itemDelete);
    setOpenDeleteDialog(true);
  }

  const handleCloseAlert = () => {
    setOpenAlert(true);
  }

  return (

    <Component.Container>
      <BasicModal isOpen={editModal} >
        <TextField fullWidth onChange={e => setTaskModal(e.target.value)} value={taskModal} type="text" label="Descrição da tarefa" />
        <Button color='error' variant='contained' onClick={() => setEditModal(false)}>Cancelar</Button>
        <Button color='success' variant='contained' onClick={editListTask}>Confirmar</Button>
      </BasicModal>

      <Component.Area>
        <Component.Header>
          Lista de Tarefas
        </Component.Header>
        <Area>
          <input type="text"
            placeholder='Adicione uma tarefa'
            value={inputText}
            onChange={e => setInputText(e.target.value)}
          />
          <button onClick={() => addTask(inputText)}>Adicionar Tarefa</button>
        </Area>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
          <ButtonDefault actionConfirm={() => setFilter('Todas')} title={'Todas'} />
          <ButtonDefault actionConfirm={() => setFilter('Pendentes')} title={'Pendentes'} />
          <ButtonDefault actionConfirm={() => setFilter('done')} title={'Concluídas'} />
        </div>

        {filteredTasks.map(task => (
          <div key={task.id}>
            <ItemStyled done={task.done}>
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleTask(task.id)}
              />
              <p style={{ color: '#ccc', textDecoration: task.done ? 'line-through' : 'initial' }}>
                {task.name}
              </p>
              <div style={{ justifyContent: 'flex-end', paddingInlineStart: '80px' }}>
                <IconButton onClick={() => openEditModal(task)} style={{ color: '#25d60e' }} edge="start" aria-label="delete">
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => openDeleteTask(task)} style={{ color: '#e3f42a' }} edge="end" aria-label="delete">
                  <DeleteIcon />
                </IconButton>
              </div>
            </ItemStyled>
          </div>
        ))}
      </Component.Area>

      <AlertStyled>
        <Snackbar open={openAlert} autoHideDuration={1800} onClose={() => setOpenAlert(false)}>
          <Alert onClose={() => setOpenAlert(false)} severity="success">
            Tarefa excluída com sucesso !
          </Alert>
        </Snackbar>
      </AlertStyled>

      <DialogConfirm titleTask={'Deseja realmente excluir a tarefa'} descriptionTask={taskDelete?.name || ''} openDialog={openDeleteDialog} actionCancel={() => setOpenDeleteDialog(false)} actionConfirm={deleteListTask} />
    </Component.Container >

  );
};

export default App;
