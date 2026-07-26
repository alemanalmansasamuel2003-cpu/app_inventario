import React, { useState } from 'react';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import api from '../services/api';

/**
 * =====================================================
 * PANTALLA: EDITAR PRODUCTO
 * =====================================================
 *
 * Permite modificar la información de un producto.
 *
 * Funcionalidades:
 *
 * ✔ Editar nombre.
 * ✔ Editar descripción.
 * ✔ Editar cantidad.
 * ✔ Editar unidad de medida.
 * ✔ Editar stock mínimo.
 * ✔ Editar fecha de vencimiento.
 * ✔ Permitir productos sin fecha de vencimiento.
 * ✔ Validar los datos antes de enviarlos.
 * ✔ Evitar múltiples solicitudes.
 * ✔ Mostrar un indicador mientras se actualiza.
 *
 * =====================================================
 */

export default function EditarProducto() {

  /**
   * =====================================================
   * PARÁMETROS RECIBIDOS
   * =====================================================
   */

  const parametros = useLocalSearchParams<{
    id?: string | string[];
    nombre?: string | string[];
    descripcion?: string | string[];
    cantidad?: string | string[];
    unidad_medida?: string | string[];
    stock_minimo?: string | string[];
    fecha_vencimiento?: string | string[];
  }>();

  /**
   * Convierte los parámetros recibidos
   * en una cadena segura.
   */
  const obtenerParametro = (
    valor?: string | string[]
  ): string => {

    if (Array.isArray(valor)) {
      return valor[0] || '';
    }

    return valor || '';
  };

  const idProducto =
    obtenerParametro(parametros.id);

  const fechaRecibida =
    obtenerParametro(
      parametros.fecha_vencimiento
    );

  /**
   * =====================================================
   * ESTADOS DEL FORMULARIO
   * =====================================================
   */

  const [
    nombre,
    setNombre,
  ] = useState(
    obtenerParametro(parametros.nombre)
  );

  const [
    descripcion,
    setDescripcion,
  ] = useState(
    obtenerParametro(
      parametros.descripcion
    )
  );

  const [
    cantidad,
    setCantidad,
  ] = useState(
    obtenerParametro(
      parametros.cantidad
    )
  );

  const [
    unidadMedida,
    setUnidadMedida,
  ] = useState(
    obtenerParametro(
      parametros.unidad_medida
    )
  );

  const [
    stockMinimo,
    setStockMinimo,
  ] = useState(
    obtenerParametro(
      parametros.stock_minimo
    )
  );

  const [
    fechaVencimiento,
    setFechaVencimiento,
  ] = useState(
    fechaRecibida &&
    fechaRecibida !== 'null' &&
    fechaRecibida !== 'N/A'
      ? fechaRecibida.substring(0, 10)
      : ''
  );

  const [
    actualizando,
    setActualizando,
  ] = useState(false);

  /**
   * =====================================================
   * MOSTRAR MENSAJES
   * =====================================================
   */

  const mostrarMensaje = (
    titulo: string,
    mensaje: string
  ) => {

    Alert.alert(
      titulo,
      mensaje
    );
  };

  /**
   * =====================================================
   * VALIDAR FECHA
   * =====================================================
   *
   * Verifica:
   *
   * ✔ Formato AAAA-MM-DD.
   * ✔ Que la fecha exista realmente.
   *
   * Ejemplo inválido:
   * 2026-02-31
   */
  const fechaValida = (
    fecha: string
  ): boolean => {

    const expresion =
      /^\d{4}-\d{2}-\d{2}$/;

    if (!expresion.test(fecha)) {
      return false;
    }

    const [
      anio,
      mes,
      dia,
    ] = fecha
      .split('-')
      .map(Number);

    const fechaCreada =
      new Date(
        anio,
        mes - 1,
        dia
      );

    return (
      fechaCreada.getFullYear() === anio &&
      fechaCreada.getMonth() === mes - 1 &&
      fechaCreada.getDate() === dia
    );
  };

  /**
   * =====================================================
   * ACTUALIZAR PRODUCTO
   * =====================================================
   */

  const actualizarProducto = async () => {

    if (actualizando) {
      return;
    }

    const idNumerico =
      Number(idProducto);

    const nombreLimpio =
      nombre.trim();

    const descripcionLimpia =
      descripcion.trim();

    const cantidadLimpia =
      cantidad.trim();

    const unidadLimpia =
      unidadMedida.trim();

    const stockMinimoLimpio =
      stockMinimo.trim();

    const fechaLimpia =
      fechaVencimiento.trim();

    /**
     * Validar identificador.
     */
    if (
      !idProducto ||
      !Number.isInteger(idNumerico) ||
      idNumerico <= 0
    ) {

      mostrarMensaje(
        'Error',
        'No se recibió un identificador de producto válido.'
      );

      return;
    }

    /**
     * Validar nombre.
     */
    if (!nombreLimpio) {

      mostrarMensaje(
        'Nombre obligatorio',
        'Debe ingresar el nombre del producto.'
      );

      return;
    }

    if (nombreLimpio.length < 2) {

      mostrarMensaje(
        'Nombre inválido',
        'El nombre debe contener al menos 2 caracteres.'
      );

      return;
    }

    /**
     * La descripción es obligatoria.
     */
    if (!descripcionLimpia) {

      mostrarMensaje(
        'Descripción obligatoria',
        'Debe ingresar una descripción.'
      );

      return;
    }

    /**
     * Validar unidad de medida.
     */
    if (!unidadLimpia) {

      mostrarMensaje(
        'Unidad obligatoria',
        'Debe ingresar la unidad de medida.'
      );

      return;
    }

    /**
     * La cantidad puede ser 0,
     * por eso no se valida con !cantidad.
     */
    if (!cantidadLimpia) {

      mostrarMensaje(
        'Cantidad obligatoria',
        'Debe ingresar la cantidad disponible.'
      );

      return;
    }

    if (!stockMinimoLimpio) {

      mostrarMensaje(
        'Stock obligatorio',
        'Debe ingresar el stock mínimo.'
      );

      return;
    }

    const cantidadNumerica =
      Number(cantidadLimpia);

    const stockMinimoNumerico =
      Number(stockMinimoLimpio);

    /**
     * Validar números.
     */
    if (
      !Number.isFinite(
        cantidadNumerica
      )
    ) {

      mostrarMensaje(
        'Cantidad inválida',
        'La cantidad debe ser un número válido.'
      );

      return;
    }

    if (
      !Number.isFinite(
        stockMinimoNumerico
      )
    ) {

      mostrarMensaje(
        'Stock inválido',
        'El stock mínimo debe ser un número válido.'
      );

      return;
    }

    /**
     * Como se registran unidades completas,
     * solo se aceptan números enteros.
     */
    if (
      !Number.isInteger(
        cantidadNumerica
      )
    ) {

      mostrarMensaje(
        'Cantidad inválida',
        'La cantidad debe ser un número entero.'
      );

      return;
    }

    if (
      !Number.isInteger(
        stockMinimoNumerico
      )
    ) {

      mostrarMensaje(
        'Stock inválido',
        'El stock mínimo debe ser un número entero.'
      );

      return;
    }

    /**
     * Validar valores negativos.
     */
    if (cantidadNumerica < 0) {

      mostrarMensaje(
        'Cantidad inválida',
        'La cantidad no puede ser negativa.'
      );

      return;
    }

    if (stockMinimoNumerico < 0) {

      mostrarMensaje(
        'Stock inválido',
        'El stock mínimo no puede ser negativo.'
      );

      return;
    }

    /**
     * La fecha es opcional.
     *
     * Solo se valida cuando el usuario
     * ingresó una fecha.
     */
    if (
      fechaLimpia &&
      !fechaValida(fechaLimpia)
    ) {

      mostrarMensaje(
        'Fecha inválida',
        'Ingrese una fecha válida con el formato AAAA-MM-DD.'
      );

      return;
    }

    try {

      setActualizando(true);

      /**
       * Cuando no existe fecha de vencimiento,
       * se envía null al backend.
       */
      const datosProducto = {
        nombre: nombreLimpio,
        descripcion:
          descripcionLimpia,
        cantidad:
          cantidadNumerica,
        unidad_medida:
          unidadLimpia,
        stock_minimo:
          stockMinimoNumerico,
        fecha_vencimiento:
          fechaLimpia || null,
      };

      console.log(
        'Actualizando producto:',
        {
          id_producto:
            idNumerico,
          ...datosProducto,
        }
      );

      const response =
        await api.put(
          `/productos/${idNumerico}`,
          datosProducto
        );

      Alert.alert(
        'Éxito',
        response.data?.mensaje ||
        response.data?.message ||
        'Producto actualizado correctamente.',
        [
          {
            text: 'Aceptar',
            onPress: () =>
              router.back(),
          },
        ]
      );

    } catch (error: any) {

      console.error(
        'Error al actualizar producto:',
        error.response?.data ||
        error.message
      );

      mostrarMensaje(
        'Error',
        error.response?.data?.mensaje ||
        error.response?.data?.message ||
        'No se pudo actualizar el producto.'
      );

    } finally {

      setActualizando(false);
    }
  };

  /**
   * =====================================================
   * INTERFAZ
   * =====================================================
   */

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={
          styles.contenido
        }
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* Botón volver */}

        <TouchableOpacity
          style={styles.botonVolver}
          onPress={() => router.back()}
          disabled={actualizando}
          activeOpacity={0.8}
        >
          <Text
            style={
              styles.textoBotonVolver
            }
          >
            ← Volver
          </Text>
        </TouchableOpacity>

        {/* Tarjeta principal */}

        <View style={styles.card}>

          <Text style={styles.iconoTitulo}>
            ✏️
          </Text>

          <Text style={styles.titulo}>
            Editar Producto
          </Text>

          <Text style={styles.subtitulo}>
            Modifique la información del producto
          </Text>

          {/* Nombre */}

          <Text style={styles.label}>
            Nombre del producto
          </Text>

          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ingrese el nombre"
            placeholderTextColor="#8A8A8A"
            editable={!actualizando}
            autoCapitalize="sentences"
            maxLength={120}
          />

          {/* Descripción */}

          <Text style={styles.label}>
            Descripción
          </Text>

          <TextInput
            style={[
              styles.input,
              styles.inputDescripcion,
            ]}
            value={descripcion}
            onChangeText={
              setDescripcion
            }
            placeholder="Ingrese una descripción"
            placeholderTextColor="#8A8A8A"
            editable={!actualizando}
            multiline
            textAlignVertical="top"
            maxLength={500}
          />

          {/* Cantidad */}

          <Text style={styles.label}>
            Cantidad disponible
          </Text>

          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={cantidad}
            onChangeText={(valor) =>
              setCantidad(
                valor.replace(
                  /[^0-9]/g,
                  ''
                )
              )
            }
            placeholder="Ejemplo: 25"
            placeholderTextColor="#8A8A8A"
            editable={!actualizando}
            maxLength={10}
          />

          {/* Unidad */}

          <Text style={styles.label}>
            Unidad de medida
          </Text>

          <TextInput
            style={styles.input}
            value={unidadMedida}
            onChangeText={
              setUnidadMedida
            }
            placeholder="Ejemplo: unidades, cajas, kg"
            placeholderTextColor="#8A8A8A"
            editable={!actualizando}
            maxLength={50}
          />

          {/* Stock mínimo */}

          <Text style={styles.label}>
            Stock mínimo
          </Text>

          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={stockMinimo}
            onChangeText={(valor) =>
              setStockMinimo(
                valor.replace(
                  /[^0-9]/g,
                  ''
                )
              )
            }
            placeholder="Ejemplo: 5"
            placeholderTextColor="#8A8A8A"
            editable={!actualizando}
            maxLength={10}
          />

          {/* Fecha */}

          <Text style={styles.label}>
            Fecha de vencimiento
          </Text>

          <TextInput
            style={styles.input}
            placeholder="AAAA-MM-DD"
            placeholderTextColor="#8A8A8A"
            value={fechaVencimiento}
            onChangeText={
              setFechaVencimiento
            }
            editable={!actualizando}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />

          <Text style={styles.textoAyuda}>
            Este campo puede quedar vacío para productos sin vencimiento.
          </Text>

          {/* Botón actualizar */}

          <TouchableOpacity
            style={[
              styles.botonActualizar,
              actualizando &&
                styles.botonDeshabilitado,
            ]}
            onPress={
              actualizarProducto
            }
            disabled={actualizando}
            activeOpacity={0.8}
          >
            {
              actualizando
                ? (
                  <View
                    style={
                      styles.contenidoBoton
                    }
                  >
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />

                    <Text
                      style={
                        styles.textoBoton
                      }
                    >
                      Actualizando...
                    </Text>
                  </View>
                )
                : (
                  <Text
                    style={
                      styles.textoBoton
                    }
                  >
                    💾 Actualizar producto
                  </Text>
                )
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/**
 * =====================================================
 * ESTILOS
 * =====================================================
 */

const styles = StyleSheet.create({

  keyboardContainer: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },

  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },

  contenido: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 50,
  },

  botonVolver: {
    marginTop: 10,
    marginBottom: 20,
    alignSelf: 'flex-start',
    backgroundColor: '#0D6EFD',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },

  textoBotonVolver: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },

  card: {
    width: '100%',
    maxWidth: 650,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E3E8EF',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },

  iconoTitulo: {
    fontSize: 45,
    textAlign: 'center',
    marginBottom: 5,
  },

  titulo: {
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    color: '#0D3B66',
  },

  subtitulo: {
    marginTop: 6,
    marginBottom: 25,
    fontSize: 15,
    color: '#667085',
    textAlign: 'center',
  },

  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#344054',
    marginBottom: 8,
    marginTop: 5,
  },

  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#D9DEE7',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 13,
    marginBottom: 15,
    backgroundColor: '#F9FAFB',
    color: '#1D2939',
    fontSize: 16,
  },

  inputDescripcion: {
    minHeight: 100,
  },

  textoAyuda: {
    fontSize: 13,
    color: '#667085',
    marginTop: -6,
    marginBottom: 20,
  },

  botonActualizar: {
    minHeight: 54,
    backgroundColor: '#28A745',
    paddingVertical: 16,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginTop: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  botonDeshabilitado: {
    opacity: 0.65,
  },

  contenidoBoton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },

  textoBoton: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
  },
});