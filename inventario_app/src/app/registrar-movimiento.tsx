import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import {
  Picker,
} from '@react-native-picker/picker';

import api from '../services/api';

/**
 * Tipos de movimientos permitidos.
 */
type TipoMovimiento =
  | 'ENTRADA'
  | 'SALIDA';

/**
 * Estructura de un producto recibido
 * desde el backend.
 */
interface Producto {
  id_producto: number;
  nombre: string;
  cantidad: number;
  unidad_medida: string;
}

/**
 * Estructura de un donante recibido
 * desde el backend.
 */
interface Donante {
  id_donante: number;
  nombre: string;
  tipo?: string;
  telefono?: string;
  correo?: string;
}

/**
 * ============================================================
 * PANTALLA: REGISTRAR MOVIMIENTO
 * ============================================================
 *
 * Permite registrar:
 *
 * ✔ Entradas normales.
 * ✔ Salidas normales.
 * ✔ Donaciones.
 * ✔ Seleccionar quién realizó la donación.
 * ✔ Seleccionar un producto existente.
 * ✔ Sumar la cantidad donada al inventario.
 * ✔ Mostrar la existencia actual.
 * ✔ Crear un producto si todavía no existe.
 * ✔ Guardar quién registró el movimiento.
 * ✔ Guardar de dónde provino el ingreso.
 *
 * ============================================================
 */
export default function RegistrarMovimiento() {

  /**
   * ============================================================
   * PARÁMETROS RECIBIDOS
   * ============================================================
   */
  const parametros = useLocalSearchParams();

  /**
   * Expo Router puede devolver:
   *
   * string
   * string[]
   * undefined
   *
   * Esta función convierte siempre el valor a string.
   */
  const obtenerParametro = (
    valor: string | string[] | undefined,
    valorPredeterminado = ''
  ): string => {

    if (Array.isArray(valor)) {
      return valor[0] || valorPredeterminado;
    }

    return valor || valorPredeterminado;
  };

  /**
   * Datos del usuario autenticado.
   */
  const idUsuario = obtenerParametro(
    parametros.id
  );

  const nombreUsuario = obtenerParametro(
    parametros.nombre,
    'Usuario'
  );

  const correoUsuario = obtenerParametro(
    parametros.correo
  );

  const rolUsuario = obtenerParametro(
    parametros.rol,
    'Usuario'
  );

  /**
   * Parámetros que permiten identificar
   * cuándo la pantalla fue abierta desde
   * el módulo de donaciones.
   */
  const tipoRecibido = obtenerParametro(
    parametros.tipo
  ).toLowerCase();

  const origenRecibido = obtenerParametro(
    parametros.origen
  ).toLowerCase();

  /**
   * Será verdadero cuando la pantalla haya sido
   * abierta desde menu-donaciones.tsx.
   */
  const esDonacion =
    origenRecibido === 'donacion';

  /**
   * ============================================================
   * ESTADOS
   * ============================================================
   */

  const [
    productos,
    setProductos,
  ] = useState<Producto[]>([]);

  const [
    donantes,
    setDonantes,
  ] = useState<Donante[]>([]);

  const [
    tipoMovimiento,
    setTipoMovimiento,
  ] = useState<TipoMovimiento>(
    tipoRecibido === 'salida'
      ? 'SALIDA'
      : 'ENTRADA'
  );

  const [
    idProducto,
    setIdProducto,
  ] = useState('');

  const [
    idDonante,
    setIdDonante,
  ] = useState('');

  const [
    cantidad,
    setCantidad,
  ] = useState('');

  const [
    motivo,
    setMotivo,
  ] = useState(
    esDonacion
      ? 'Donación'
      : tipoRecibido === 'salida'
        ? 'Entrega'
        : 'Donación'
  );

  const [
    detalle,
    setDetalle,
  ] = useState('');

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  /**
   * ============================================================
   * PRODUCTO SELECCIONADO
   * ============================================================
   */
  const productoSeleccionado = useMemo(
    () =>
      productos.find(
        producto =>
          producto.id_producto ===
          Number(idProducto)
      ),
    [
      productos,
      idProducto,
    ]
  );

  /**
   * ============================================================
   * DONANTE SELECCIONADO
   * ============================================================
   */
  const donanteSeleccionado = useMemo(
    () =>
      donantes.find(
        donante =>
          donante.id_donante ===
          Number(idDonante)
      ),
    [
      donantes,
      idDonante,
    ]
  );

  /**
   * ============================================================
   * MOSTRAR MENSAJES
   * ============================================================
   */
  const mostrarMensaje = (
    titulo: string,
    mensaje: string
  ): void => {

    if (
      Platform.OS === 'web' &&
      typeof window !== 'undefined'
    ) {

      window.alert(
        `${titulo}\n\n${mensaje}`
      );

      return;
    }

    Alert.alert(
      titulo,
      mensaje
    );
  };

  /**
   * ============================================================
   * EXTRAER LISTA DE UNA RESPUESTA
   * ============================================================
   *
   * Permite aceptar respuestas con las estructuras:
   *
   * { success: true, data: [] }
   *
   * { datos: [] }
   *
   * []
   */
  const obtenerListaRespuesta = <T,>(
    respuesta: any
  ): T[] => {

    if (
      Array.isArray(
        respuesta?.data?.data
      )
    ) {
      return respuesta.data.data;
    }

    if (
      Array.isArray(
        respuesta?.data?.datos
      )
    ) {
      return respuesta.data.datos;
    }

    if (
      Array.isArray(
        respuesta?.data
      )
    ) {
      return respuesta.data;
    }

    return [];
  };

  /**
   * ============================================================
   * CARGAR PRODUCTOS
   * ============================================================
   */
  const cargarProductos =
    async (): Promise<void> => {

      const respuesta =
        await api.get(
          '/productos'
        );

      const listaProductos =
        obtenerListaRespuesta<Producto>(
          respuesta
        );

      setProductos(
        listaProductos
      );
    };

  /**
   * ============================================================
   * CARGAR DONANTES
   * ============================================================
   *
   * Solo se utiliza cuando la pantalla corresponde
   * al registro de una donación.
   */
  const cargarDonantes =
    async (): Promise<void> => {

      const respuesta =
        await api.get(
          '/donantes'
        );

      const listaDonantes =
        obtenerListaRespuesta<Donante>(
          respuesta
        );

      setDonantes(
        listaDonantes
      );
    };

  /**
   * ============================================================
   * CARGAR DATOS INICIALES
   * ============================================================
   */
  const cargarDatosIniciales =
    async (): Promise<void> => {

      try {

        setCargando(true);

        /**
         * Siempre se cargan los productos.
         */
        const solicitudes: Promise<void>[] = [
          cargarProductos(),
        ];

        /**
         * Los donantes solamente se cargan
         * cuando el origen es una donación.
         */
        if (esDonacion) {
          solicitudes.push(
            cargarDonantes()
          );
        }

        await Promise.all(
          solicitudes
        );

      } catch (error: any) {

        console.error(
          'Error al cargar los datos:',
          error?.response?.data ||
          error?.message ||
          error
        );

        mostrarMensaje(
          'Error',
          error?.response?.data?.message ||
          error?.response?.data?.mensaje ||
          'No se pudieron cargar los datos necesarios.'
        );

      } finally {

        setCargando(false);
      }
    };

  /**
   * Cargar información cuando abre la pantalla.
   */
  useEffect(() => {

    cargarDatosIniciales();

  }, []);

  /**
   * ============================================================
   * VALORES SEGÚN TIPO DE MOVIMIENTO
   * ============================================================
   */
  useEffect(() => {

    /**
     * Cuando es donación, siempre debe permanecer
     * como ENTRADA y el motivo será Donación.
     */
    if (esDonacion) {

      setTipoMovimiento(
        'ENTRADA'
      );

      setMotivo(
        'Donación'
      );

      return;
    }

    if (
      tipoMovimiento ===
      'ENTRADA'
    ) {

      setMotivo(
        'Donación'
      );

    } else {

      setMotivo(
        'Entrega'
      );
    }

  }, [
    tipoMovimiento,
    esDonacion,
  ]);

  /**
   * ============================================================
   * CAMBIAR TIPO DE MOVIMIENTO
   * ============================================================
   */
  const cambiarTipoMovimiento = (
    valor: string
  ): void => {

    /**
     * En una donación no se permite cambiar
     * el movimiento a salida.
     */
    if (esDonacion) {
      return;
    }

    if (
      valor === 'ENTRADA' ||
      valor === 'SALIDA'
    ) {

      setTipoMovimiento(
        valor
      );

      setIdProducto('');
      setCantidad('');
      setDetalle('');
      setIdDonante('');
    }
  };

  /**
   * ============================================================
   * CAMBIAR CANTIDAD
   * ============================================================
   *
   * Permite únicamente números enteros.
   */
  const cambiarCantidad = (
    texto: string
  ): void => {

    setCantidad(
      texto.replace(
        /[^0-9]/g,
        ''
      )
    );
  };

  /**
   * ============================================================
   * LIMPIAR FORMULARIO
   * ============================================================
   */
  const limpiarFormulario =
    (): void => {

      setIdProducto('');
      setIdDonante('');
      setCantidad('');
      setDetalle('');

      if (esDonacion) {

        setTipoMovimiento(
          'ENTRADA'
        );

        setMotivo(
          'Donación'
        );

        return;
      }

      setMotivo(
        tipoMovimiento === 'ENTRADA'
          ? 'Donación'
          : 'Entrega'
      );
    };

  /**
   * ============================================================
   * ABRIR PANTALLA PARA CREAR PRODUCTO
   * ============================================================
   *
   * Permite crear un producto cuando el artículo donado
   * todavía no existe en la base de datos.
   */
  const abrirCrearProducto =
    (): void => {

      router.push({
        pathname:
          '/agregar-producto' as any,

        params: {
          id: idUsuario,
          nombre: nombreUsuario,
          correo: correoUsuario,
          rol: rolUsuario,

          /**
           * Estos parámetros permiten saber
           * desde dónde se abrió agregar-producto.
           */
          regreso:
            'registrar-movimiento',

          tipo:
            'entrada',

          origen:
            'donacion',

          idDonante:
            idDonante,
        },
      } as any);
    };

  /**
   * ============================================================
   * ABRIR ADMINISTRACIÓN DE DONANTES
   * ============================================================
   *
   * Se utiliza cuando el donante todavía no está registrado.
   */
  const abrirRegistrarDonante =
    (): void => {

      router.push({
        pathname:
          '/donantes' as any,

        params: {
          id: idUsuario,
          nombre: nombreUsuario,
          correo: correoUsuario,
          rol: rolUsuario,

          regreso:
            'registrar-movimiento',

          origen:
            'donacion',
        },
      } as any);
    };

  /**
   * ============================================================
   * REGISTRAR MOVIMIENTO
   * ============================================================
   */
  const registrarMovimiento =
    async (): Promise<void> => {

      if (guardando) {
        return;
      }

      const productoId =
        Number(idProducto);

      const usuarioId =
        Number(idUsuario);

      const donanteId =
        Number(idDonante);

      const cantidadNumerica =
        Number(cantidad);

      const motivoLimpio =
        motivo.trim();

      const detalleLimpio =
        detalle.trim();

      /**
       * Validar donante.
       */
      if (
        esDonacion &&
        (
          !Number.isInteger(
            donanteId
          ) ||
          donanteId <= 0
        )
      ) {

        mostrarMensaje(
          'Validación',
          'Seleccione quién realizó la donación.'
        );

        return;
      }

      /**
       * Validar producto.
       */
      if (
        !Number.isInteger(
          productoId
        ) ||
        productoId <= 0
      ) {

        mostrarMensaje(
          'Validación',
          'Seleccione el producto recibido.'
        );

        return;
      }

      /**
       * Validar que el producto realmente
       * exista en la lista cargada.
       */
      if (
        !productoSeleccionado
      ) {

        mostrarMensaje(
          'Validación',
          'El producto seleccionado no existe o ya no está disponible.'
        );

        return;
      }

      /**
       * Validar cantidad.
       */
      if (
        cantidad.trim() === '' ||
        !Number.isInteger(
          cantidadNumerica
        ) ||
        cantidadNumerica <= 0
      ) {

        mostrarMensaje(
          'Validación',
          'Ingrese una cantidad entera mayor que cero.'
        );

        return;
      }

      /**
       * Validar inventario para salidas.
       */
      if (
        tipoMovimiento ===
          'SALIDA' &&
        cantidadNumerica >
          Number(
            productoSeleccionado.cantidad
          )
      ) {

        mostrarMensaje(
          'Inventario insuficiente',
          `La existencia disponible es de ${productoSeleccionado.cantidad} ${productoSeleccionado.unidad_medida}.`
        );

        return;
      }

      /**
       * Validar motivo.
       */
      if (
        motivoLimpio === ''
      ) {

        mostrarMensaje(
          'Validación',
          'Ingrese el motivo del movimiento.'
        );

        return;
      }

      try {

        setGuardando(true);

        /**
         * Información común para entradas y salidas.
         */
        const datosMovimiento = {

          id_producto:
            productoId,

          id_usuario:
            Number.isInteger(
              usuarioId
            ) &&
            usuarioId > 0
              ? usuarioId
              : null,

          cantidad:
            cantidadNumerica,

          motivo:
            esDonacion
              ? 'Donación'
              : motivoLimpio,

          /**
           * Se conserva el nombre observaciones porque
           * actualmente el backend probablemente espera
           * esta propiedad.
           */
          observaciones:
            detalleLimpio ||
            null,
        };

        /**
         * ======================================================
         * REGISTRAR ENTRADA
         * ======================================================
         */
        if (
          tipoMovimiento ===
          'ENTRADA'
        ) {

          await api.post(
            '/movimientos/entrada',
            {
              ...datosMovimiento,

              /**
               * Guarda de quién provino la donación.
               *
               * Para entradas que no son donaciones
               * se envía null.
               */
              id_donante:
                esDonacion
                  ? donanteId
                  : null,

              /**
               * Permite al backend diferenciar una donación
               * de otra clase de entrada.
               */
              origen:
                esDonacion
                  ? 'DONACION'
                  : 'ENTRADA',
            }
          );

        } else {

          /**
           * ====================================================
           * REGISTRAR SALIDA
           * ====================================================
           */
          await api.post(
            '/movimientos/salida',
            datosMovimiento
          );
        }

        /**
         * Guardamos los nombres antes de limpiar
         * el formulario para mostrarlos en el mensaje.
         */
        const nombreProducto =
          productoSeleccionado.nombre;

        const nombreDonante =
          donanteSeleccionado?.nombre ||
          'Donante';

        limpiarFormulario();

        /**
         * Actualiza los productos y permite ver
         * la nueva existencia.
         */
        await cargarProductos();

        /**
         * Mensaje para navegador.
         */
        if (
          Platform.OS === 'web' &&
          typeof window !== 'undefined'
        ) {

          if (esDonacion) {

            window.alert(
              'Donación registrada\n\n' +
              `Donante: ${nombreDonante}\n` +
              `Producto: ${nombreProducto}\n` +
              `Cantidad recibida: ${cantidadNumerica}\n\n` +
              'La existencia del producto se actualizó correctamente.'
            );

          } else {

            window.alert(
              tipoMovimiento ===
                'ENTRADA'
                ? 'Movimiento registrado\n\nLa entrada se registró correctamente.'
                : 'Movimiento registrado\n\nLa salida se registró correctamente.'
            );
          }

          return;
        }

        /**
         * Mensaje para Android e iOS.
         */
        Alert.alert(
          esDonacion
            ? 'Donación registrada'
            : 'Movimiento registrado',

          esDonacion
            ? `La donación de ${nombreProducto}, realizada por ${nombreDonante}, se registró correctamente.`
            : tipoMovimiento ===
                'ENTRADA'
              ? 'La entrada se registró correctamente.'
              : 'La salida se registró correctamente.',

          [
            {
              text:
                esDonacion
                  ? 'Registrar otra'
                  : 'Registrar otro',
            },

            {
              text:
                esDonacion
                  ? 'Ver historial'
                  : 'Ver movimientos',

              onPress: () => {

                router.replace({
                  pathname:
                    esDonacion
                      ? '/historial-donaciones' as any
                      : '/movimientos' as any,

                  params: {
                    id: idUsuario,
                    nombre: nombreUsuario,
                    correo: correoUsuario,
                    rol: rolUsuario,
                  },
                } as any);
              },
            },
          ]
        );

      } catch (error: any) {

        console.error(
          'Error al registrar movimiento:',
          error?.response?.data ||
          error?.message ||
          error
        );

        mostrarMensaje(
          'Error',
          error?.response?.data?.message ||
          error?.response?.data?.mensaje ||
          error?.response?.data?.error ||
          error?.message ||
          'No se pudo registrar el movimiento.'
        );

      } finally {

        setGuardando(false);
      }
    };

  /**
   * ============================================================
   * PANTALLA DE CARGA
   * ============================================================
   */
  if (cargando) {

    return (
      <View style={styles.cargando}>

        <ActivityIndicator
          size="large"
          color={
            esDonacion
              ? '#198754'
              : '#0D6EFD'
          }
        />

        <Text style={styles.textoCargando}>
          {esDonacion
            ? 'Cargando productos y donantes...'
            : 'Cargando productos...'}
        </Text>

      </View>
    );
  }

  /**
   * ============================================================
   * INTERFAZ
   * ============================================================
   */
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* =====================================================
            BOTÓN VOLVER
        ====================================================== */}

        <TouchableOpacity
          style={styles.botonVolver}
          onPress={() =>
            router.back()
          }
          disabled={guardando}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Volver a la pantalla anterior"
        >
          <Text style={styles.textoBotonVolver}>
            ← Volver
          </Text>
        </TouchableOpacity>

        {/* =====================================================
            ENCABEZADO
        ====================================================== */}

        <View
          style={[
            styles.encabezado,
            esDonacion &&
            styles.encabezadoDonacion,
          ]}
        >
          <Text style={styles.iconoTitulo}>
            {esDonacion
              ? '🎁'
              : '🔄'}
          </Text>

          <Text style={styles.titulo}>
            {esDonacion
              ? 'Registrar Donación'
              : 'Registrar Movimiento'}
          </Text>

          <Text style={styles.subtitulo}>
            {esDonacion
              ? 'Registre quién donó y los productos recibidos'
              : 'Registre entradas y salidas del inventario'}
          </Text>

          {esDonacion && (
            <>
              <Text style={styles.usuarioEncabezado}>
                Usuario: {nombreUsuario}
              </Text>

              <Text style={styles.rolEncabezado}>
                Rol: {rolUsuario}
              </Text>
            </>
          )}
        </View>

        {/* =====================================================
            FORMULARIO
        ====================================================== */}

        <View style={styles.tarjeta}>

          {/* TIPO DE MOVIMIENTO */}

          <Text style={styles.etiqueta}>
            Tipo de movimiento
          </Text>

          <View
            style={[
              styles.contenedorPicker,

              tipoMovimiento ===
                'ENTRADA'
                ? styles.pickerEntrada
                : styles.pickerSalida,

              esDonacion &&
              styles.campoBloqueado,
            ]}
          >
            <Picker
              selectedValue={tipoMovimiento}
              onValueChange={cambiarTipoMovimiento}
              enabled={
                !guardando &&
                !esDonacion
              }
              style={styles.picker}
            >
              <Picker.Item
                label={
                  esDonacion
                    ? '🎁 Entrada por donación'
                    : '📥 Entrada'
                }
                value="ENTRADA"
              />

              {!esDonacion && (
                <Picker.Item
                  label="📤 Salida"
                  value="SALIDA"
                />
              )}
            </Picker>
          </View>

          {/* MENSAJE SEGÚN MOVIMIENTO */}

          <View
            style={[
              styles.avisoTipo,

              tipoMovimiento ===
                'ENTRADA'
                ? styles.avisoEntrada
                : styles.avisoSalida,
            ]}
          >
            <Text
              style={[
                styles.textoAviso,

                tipoMovimiento ===
                  'ENTRADA'
                  ? styles.textoEntrada
                  : styles.textoSalida,
              ]}
            >
              {esDonacion
                ? 'La cantidad donada se sumará automáticamente al inventario.'
                : tipoMovimiento ===
                    'ENTRADA'
                  ? 'La existencia del producto aumentará.'
                  : 'La existencia del producto disminuirá.'}
            </Text>
          </View>

          {/* ===================================================
              DONANTE
          ==================================================== */}

          {esDonacion && (
            <>
              <Text style={styles.etiqueta}>
                Donante *
              </Text>

              <View style={styles.contenedorPicker}>
                <Picker
                  selectedValue={idDonante}
                  onValueChange={valor =>
                    setIdDonante(
                      String(valor)
                    )
                  }
                  enabled={!guardando}
                  style={styles.picker}
                >
                  <Picker.Item
                    label="Seleccione quién realizó la donación"
                    value=""
                  />

                  {donantes.map(
                    donante => (

                      <Picker.Item
                        key={donante.id_donante}
                        label={
                          donante.tipo
                            ? `${donante.nombre} — ${donante.tipo}`
                            : donante.nombre
                        }
                        value={
                          String(
                            donante.id_donante
                          )
                        }
                      />

                    )
                  )}
                </Picker>
              </View>

              {donanteSeleccionado && (
                <View style={styles.tarjetaSeleccion}>

                  <Text style={styles.tituloSeleccion}>
                    Donante seleccionado
                  </Text>

                  <Text style={styles.valorSeleccion}>
                    {donanteSeleccionado.nombre}
                  </Text>

                  {donanteSeleccionado.tipo && (
                    <Text style={styles.detalleSeleccion}>
                      Tipo: {donanteSeleccionado.tipo}
                    </Text>
                  )}

                  {donanteSeleccionado.telefono && (
                    <Text style={styles.detalleSeleccion}>
                      Teléfono: {donanteSeleccionado.telefono}
                    </Text>
                  )}

                  {donanteSeleccionado.correo && (
                    <Text style={styles.detalleSeleccion}>
                      Correo: {donanteSeleccionado.correo}
                    </Text>
                  )}

                </View>
              )}

              <TouchableOpacity
                style={styles.botonSecundario}
                onPress={abrirRegistrarDonante}
                disabled={guardando}
                activeOpacity={0.8}
              >
                <Text style={styles.textoBotonSecundario}>
                  ＋ El donante no existe, registrarlo
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* ===================================================
              PRODUCTO
          ==================================================== */}

          <Text style={styles.etiqueta}>
            Producto *
          </Text>

          <View style={styles.contenedorPicker}>
            <Picker
              selectedValue={idProducto}
              onValueChange={valor =>
                setIdProducto(
                  String(valor)
                )
              }
              enabled={!guardando}
              style={styles.picker}
            >
              <Picker.Item
                label="Seleccione un producto"
                value=""
              />

              {productos.map(
                producto => (

                  <Picker.Item
                    key={producto.id_producto}
                    label={
                      `${producto.nombre} — ${producto.cantidad} ${producto.unidad_medida}`
                    }
                    value={
                      String(
                        producto.id_producto
                      )
                    }
                  />

                )
              )}
            </Picker>
          </View>

          {/* CREAR PRODUCTO NUEVO */}

          {esDonacion && (
            <TouchableOpacity
              style={styles.botonNuevoProducto}
              onPress={abrirCrearProducto}
              disabled={guardando}
              activeOpacity={0.8}
            >
              <Text style={styles.textoBotonNuevoProducto}>
                ＋ El producto no existe, crear uno nuevo
              </Text>
            </TouchableOpacity>
          )}

          {/* EXISTENCIA ACTUAL */}

          {productoSeleccionado && (
            <View style={styles.tarjetaExistencia}>

              <Text style={styles.textoExistencia}>
                Existencia actual
              </Text>

              <Text style={styles.numeroExistencia}>
                {productoSeleccionado.cantidad}{' '}
                {productoSeleccionado.unidad_medida}
              </Text>

              {cantidad !== '' &&
                Number(cantidad) > 0 &&
                tipoMovimiento === 'ENTRADA' && (
                  <Text style={styles.existenciaPosterior}>
                    Existencia después del ingreso:{' '}
                    {Number(
                      productoSeleccionado.cantidad
                    ) +
                    Number(cantidad)}{' '}
                    {productoSeleccionado.unidad_medida}
                  </Text>
                )}

              {cantidad !== '' &&
                Number(cantidad) > 0 &&
                tipoMovimiento === 'SALIDA' && (
                  <Text style={styles.existenciaPosterior}>
                    Existencia después de la salida:{' '}
                    {Math.max(
                      0,
                      Number(
                        productoSeleccionado.cantidad
                      ) -
                      Number(cantidad)
                    )}{' '}
                    {productoSeleccionado.unidad_medida}
                  </Text>
                )}

            </View>
          )}

          {/* ===================================================
              CANTIDAD
          ==================================================== */}

          <Text style={styles.etiqueta}>
            {esDonacion
              ? 'Cantidad donada *'
              : tipoMovimiento ===
                  'ENTRADA'
                ? 'Cantidad de entrada *'
                : 'Cantidad de salida *'}
          </Text>

          <TextInput
            style={styles.input}
            value={cantidad}
            onChangeText={cambiarCantidad}
            keyboardType="numeric"
            placeholder={
              tipoMovimiento ===
                'ENTRADA'
                ? 'Ejemplo: 20'
                : 'Ejemplo: 5'
            }
            placeholderTextColor="#98A2B3"
            editable={!guardando}
            maxLength={9}
          />

          {/* ===================================================
              MOTIVO
          ==================================================== */}

          <Text style={styles.etiqueta}>
            Motivo *
          </Text>

          <TextInput
            style={[
              styles.input,
              esDonacion &&
              styles.inputBloqueado,
            ]}
            value={motivo}
            onChangeText={setMotivo}
            placeholder={
              tipoMovimiento ===
                'ENTRADA'
                ? 'Ejemplo: Donación o compra'
                : 'Ejemplo: Entrega o consumo'
            }
            placeholderTextColor="#98A2B3"
            editable={
              !guardando &&
              !esDonacion
            }
          />

          {/* ===================================================
              DETALLE
          ==================================================== */}

          <Text style={styles.etiqueta}>
            Detalle
          </Text>

          <TextInput
            style={[
              styles.input,
              styles.areaTexto,
            ]}
            value={detalle}
            onChangeText={setDetalle}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholder={
              esDonacion
                ? 'Ejemplo: Productos entregados en buen estado por la comunidad'
                : 'Detalle del movimiento'
            }
            placeholderTextColor="#98A2B3"
            editable={!guardando}
            maxLength={500}
          />

          <Text style={styles.contadorCaracteres}>
            {detalle.length}/500
          </Text>

          {/* ===================================================
              BOTÓN GUARDAR
          ==================================================== */}

          <TouchableOpacity
            style={[
              styles.botonGuardar,

              tipoMovimiento ===
                'ENTRADA'
                ? styles.botonEntrada
                : styles.botonSalida,

              guardando &&
              styles.botonDeshabilitado,
            ]}
            onPress={registrarMovimiento}
            disabled={guardando}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={
              esDonacion
                ? 'Guardar donación'
                : 'Guardar movimiento'
            }
          >
            {guardando
              ? (
                <View style={styles.contenidoGuardando}>

                  <ActivityIndicator
                    color="#FFFFFF"
                  />

                  <Text style={styles.textoBoton}>
                    {esDonacion
                      ? 'Registrando donación...'
                      : 'Registrando...'}
                  </Text>

                </View>
              )
              : (
                <Text style={styles.textoBoton}>
                  {esDonacion
                    ? '🎁 Registrar Donación'
                    : tipoMovimiento ===
                        'ENTRADA'
                      ? '📥 Registrar Entrada'
                      : '📤 Registrar Salida'}
                </Text>
              )}
          </TouchableOpacity>

        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/**
 * ============================================================
 * ESTILOS
 * ============================================================
 */
const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F5F1E8',
  },

  contenido: {
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
    padding: 18,
    paddingBottom: 45,
  },

  cargando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F1E8',
  },

  textoCargando: {
    color: '#667085',
    fontSize: 16,
    marginTop: 12,
  },

  botonVolver: {
    alignSelf: 'flex-start',
    backgroundColor: '#0D3B66',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 19,
    marginTop: 10,
    marginBottom: 18,
  },

  textoBotonVolver: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  encabezado: {
    backgroundColor: '#0D3B66',
    borderRadius: 20,
    paddingVertical: 23,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginBottom: 20,
  },

  encabezadoDonacion: {
    backgroundColor: '#198754',
  },

  iconoTitulo: {
    fontSize: 43,
    marginBottom: 7,
  },

  titulo: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },

  subtitulo: {
    color: '#DCE6F0',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 6,
  },

  usuarioEncabezado: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
  },

  rolEncabezado: {
    color: '#E7F7ED',
    fontSize: 13,
    marginTop: 3,
  },

  tarjeta: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E3E8EF',

    shadowColor: '#000000',

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.09,
    shadowRadius: 7,
    elevation: 4,
  },

  etiqueta: {
    color: '#0D3B66',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 15,
    marginBottom: 8,
  },

  contenedorPicker: {
    width: '100%',
    height: 52,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 11,
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 15,
  },

  pickerEntrada: {
    borderColor: '#198754',
  },

  pickerSalida: {
    borderColor: '#DC3545',
  },

  picker: {
    width: '100%',
    height: 52,
    color: '#1D2939',
    backgroundColor: '#FFFFFF',
  },

  campoBloqueado: {
    backgroundColor: '#F2F4F7',
  },

  avisoTipo: {
    width: '100%',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 13,
    marginTop: -5,
    marginBottom: 5,
  },

  avisoEntrada: {
    backgroundColor: '#E8F5ED',
  },

  avisoSalida: {
    backgroundColor: '#FDECEC',
  },

  textoAviso: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },

  textoEntrada: {
    color: '#198754',
  },

  textoSalida: {
    color: '#DC3545',
  },

  input: {
    width: '100%',
    height: 52,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 11,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#1D2939',
    marginBottom: 15,
  },

  inputBloqueado: {
    backgroundColor: '#F2F4F7',
    color: '#667085',
  },

  areaTexto: {
    height: 120,
    paddingTop: 13,
    paddingBottom: 13,
    marginBottom: 4,
  },

  contadorCaracteres: {
    color: '#98A2B3',
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 12,
  },

  tarjetaExistencia: {
    width: '100%',
    backgroundColor: '#F4F7FB',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#E3E8EF',
    padding: 13,
    marginTop: -5,
    marginBottom: 5,
    alignItems: 'center',
  },

  textoExistencia: {
    color: '#667085',
    fontSize: 13,
    fontWeight: '700',
  },

  numeroExistencia: {
    color: '#0D3B66',
    fontSize: 21,
    fontWeight: '800',
    marginTop: 3,
  },

  existenciaPosterior: {
    color: '#198754',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 7,
    textAlign: 'center',
  },

  tarjetaSeleccion: {
    width: '100%',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBE5C8',
    borderRadius: 11,
    padding: 13,
    marginTop: -5,
    marginBottom: 12,
  },

  tituloSeleccion: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '700',
  },

  valorSeleccion: {
    color: '#198754',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 3,
  },

  detalleSeleccion: {
    color: '#475467',
    fontSize: 13,
    marginTop: 4,
  },

  botonSecundario: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#198754',
    borderRadius: 11,
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginTop: -4,
    marginBottom: 4,
    backgroundColor: '#F0FDF4',
  },

  textoBotonSecundario: {
    color: '#198754',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },

  botonNuevoProducto: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 11,
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginTop: -4,
    marginBottom: 4,
    backgroundColor: '#FFF9E6',
  },

  textoBotonNuevoProducto: {
    color: '#8A6500',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },

  botonGuardar: {
    width: '100%',
    borderRadius: 11,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginTop: 11,
  },

  botonEntrada: {
    backgroundColor: '#198754',
  },

  botonSalida: {
    backgroundColor: '#DC3545',
  },

  botonDeshabilitado: {
    opacity: 0.6,
  },

  contenidoGuardando: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  textoBoton: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
  },
});