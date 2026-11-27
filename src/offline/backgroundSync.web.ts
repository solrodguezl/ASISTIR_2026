// expo-background-task no existe en web: en el navegador la sincronización
// corre solo con la pestaña abierta (NetInfo + intervalo en monitor.ts).
export async function registrarSyncEnSegundoPlano(): Promise<void> {}
