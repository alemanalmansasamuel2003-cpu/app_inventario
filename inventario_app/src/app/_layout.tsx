/**
 * =====================================================
 * LAYOUT PRINCIPAL DE LA APLICACIÓN
 * =====================================================
 *
 * Expo Router detecta automáticamente las pantallas
 * existentes dentro de la carpeta src/app.
 *
 * Todas las pantallas se muestran sin encabezado.
 *
 * =====================================================
 */

import React from 'react';
import { Stack } from 'expo-router';

/**
 * =====================================================
 * COMPONENTE PRINCIPAL DE NAVEGACIÓN
 * =====================================================
 */
export default function RootLayout() {

  return (

    <Stack
      screenOptions={{
        headerShown: false
      }}
    />

  );
}