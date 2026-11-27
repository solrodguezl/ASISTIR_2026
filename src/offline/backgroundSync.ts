import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { sincronizar } from './sync';

const TAREA_SYNC = 'datafro-sync-offline';

// Debe definirse en el ámbito global (al importar el módulo), no dentro de un
// componente: el sistema puede despertar la app solo para correr esta tarea.
TaskManager.defineTask(TAREA_SYNC, async () => {
  try {
    await sincronizar();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

/**
 * Pide al sistema que despierte la app de vez en cuando para enviar la cola,
 * aunque no esté abierta. El intervalo es un mínimo (15 min en Android); iOS
 * decide por su cuenta cuándo correrla. Requiere un development build: en
 * Expo Go puede no estar disponible, y en ese caso simplemente no se registra.
 */
export async function registrarSyncEnSegundoPlano(): Promise<void> {
  try {
    const estado = await BackgroundTask.getStatusAsync();
    if (estado !== BackgroundTask.BackgroundTaskStatus.Available) return;

    if (!(await TaskManager.isTaskRegisteredAsync(TAREA_SYNC))) {
      await BackgroundTask.registerTaskAsync(TAREA_SYNC, { minimumInterval: 15 });
    }
  } catch {
    // Sin soporte de tareas en segundo plano: queda la sincronización en primer plano.
  }
}
