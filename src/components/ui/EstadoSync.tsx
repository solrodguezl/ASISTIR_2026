import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand } from '../../constants/brand';
import { useEstadoSync } from '../../hooks/use-estado-sync';
import { descartarErrores, reintentarErrores } from '../../offline/outbox';
import { sincronizar } from '../../offline/sync';

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/**
 * Aviso global del modo offline. No se muestra nada cuando hay conexión y la
 * cola está vacía.
 */
export function EstadoSync() {
  const { enLinea, sincronizando, pendientes, errores, ultimoError, sesionExpirada } =
    useEstadoSync();
  const [confirmarDescarte, setConfirmarDescarte] = useState(false);

  if (enLinea && pendientes === 0 && errores === 0) return null;

  let icono: keyof typeof Ionicons.glyphMap = 'cloud-offline';
  let texto: string;
  let fondo: string = Brand.orangeSoft;

  if (!enLinea) {
    texto =
      pendientes > 0
        ? `Sin conexión · ${plural(pendientes, 'registro guardado', 'registros guardados')} en el teléfono`
        : 'Sin conexión · lo que guardes se enviará después';
  } else if (sesionExpirada) {
    icono = 'lock-closed';
    texto = `Inicia sesión de nuevo para enviar ${plural(pendientes, 'registro pendiente', 'registros pendientes')}`;
  } else if (sincronizando) {
    icono = 'cloud-upload';
    texto = `Enviando ${plural(pendientes, 'registro', 'registros')}…`;
    fondo = Brand.greenSoft;
  } else if (pendientes > 0) {
    icono = 'cloud-upload';
    texto = `${plural(pendientes, 'registro pendiente', 'registros pendientes')} por enviar`;
  } else {
    icono = 'alert-circle';
    texto = `${plural(errores, 'registro no se pudo enviar', 'registros no se pudieron enviar')}`;
    fondo = '#F6D5D1';
  }

  return (
    <View style={[styles.banner, { backgroundColor: fondo }]}>
      <View style={styles.fila}>
        {sincronizando ? (
          <ActivityIndicator size="small" color={Brand.navy} />
        ) : (
          <Ionicons name={icono} size={18} color={Brand.navy} />
        )}
        <Text style={styles.texto}>{texto}</Text>

        {enLinea && pendientes > 0 && !sincronizando && !sesionExpirada ? (
          <Pressable onPress={() => void sincronizar()} hitSlop={8}>
            <Text style={styles.accion}>Enviar ahora</Text>
          </Pressable>
        ) : null}
      </View>

      {errores > 0 && !sincronizando ? (
        <View style={styles.errores}>
          <Text style={styles.detalle} numberOfLines={2}>
            {plural(errores, 'registro rechazado', 'registros rechazados')} por el servidor
            {ultimoError ? `: ${ultimoError}` : ''}
          </Text>
          <View style={styles.fila}>
            <Pressable
              onPress={() => void reintentarErrores().then(() => sincronizar())}
              hitSlop={8}
            >
              <Text style={styles.accion}>Reintentar</Text>
            </Pressable>
            {/* Descartar borra datos que no llegaron al servidor: pide un segundo toque. */}
            <Pressable
              onPress={() => {
                if (confirmarDescarte) {
                  setConfirmarDescarte(false);
                  void descartarErrores();
                } else {
                  setConfirmarDescarte(true);
                }
              }}
              hitSlop={8}
            >
              <Text style={[styles.accion, styles.descartar]}>
                {confirmarDescarte ? '¿Seguro? Toca para borrar' : 'Descartar'}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  texto: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Brand.navy,
  },
  accion: {
    fontSize: 14,
    fontWeight: '700',
    color: Brand.orangeDark,
  },
  descartar: {
    color: Brand.danger,
  },
  errores: {
    gap: 4,
  },
  detalle: {
    fontSize: 13,
    color: Brand.navy,
  },
});
