import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import { router } from 'expo-router';

import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  RefreshControl,
  Platform,
  KeyboardAvoidingView
} from 'react-native';

import api from '../services/api';

/**
 * ============================================================
 * TIPO DE DONANTE
 * ============================================================
 */
type TipoDonante =
  | 'PERSONA'
  | 'EMPRESA'
  | 'INSTITUCION'
  | 'ANONIMO';

/**
 * ============================================================
 * INTERFAZ: DONANTE
 * ============================================================
 */
interface Donante {
  id_donante: number;
  nombre: string;
  tipo_donante: TipoDonante;
  identificacion?: string | null;
  telefono?: string | null;
  correo?: string | null;
  direccion?: string | null;
  observaciones?: string | null;
}

/**
 * Respuesta posible del backend.
 *
 * Algunas consultas devuelven `tipo` y otras
 * pueden devolver `tipo_donante`. Esta interfaz
 * permite aceptar ambas formas y normalizarlas.
 */
interface DonanteApi {
  id_donante?: number | string;
  nombre?: string | null;
  nombre_donante?: string | null;
  tipo?: string | null;
  tipo_donante?: string | null;
  identificacion?: string | null;
  telefono?: string | null;
  correo?: string | null;
  direccion?: string | null;
  observaciones?: string | null;
}

/**
 * ============================================================
 * TIPOS DISPONIBLES
 * ============================================================
 */
const TIPOS_DONANTE: TipoDonante[] = [
  'PERSONA',
  'EMPRESA',
  'INSTITUCION',
  'ANONIMO'
];

/**
 * ============================================================
 * PANTALLA: DONANTES
 * ============================================================
 *
 * Funcionalidades:
 *
 * ✔ Consultar donantes.
 * ✔ Buscar donantes.
 * ✔ Registrar un donante.
 * ✔ Editar un donante.
 * ✔ Eliminar un donante.
 * ✔ Actualizar deslizando la pantalla.
 * ✔ Validar campos.
 * ✔ Mostrar mensajes en web y móvil.
 *
 * ============================================================
 */
export default function Donantes() {

  /**
   * Lista de donantes obtenida desde la API.
   */
  const [
    donantes,
    setDonantes
  ] = useState<Donante[]>([]);

  /**
   * Texto utilizado para buscar.
   */
  const [
    busqueda,
    setBusqueda
  ] = useState('');

  /**
   * Controla la carga inicial.
   */
  const [
    cargando,
    setCargando
  ] = useState(true);

  /**
   * Controla la actualización por deslizamiento.
   */
  const [
    actualizando,
    setActualizando
  ] = useState(false);

  /**
   * Controla el proceso de guardado.
   */
  const [
    guardando,
    setGuardando
  ] = useState(false);

  /**
   * Controla la visibilidad del formulario.
   */
  const [
    modalVisible,
    setModalVisible
  ] = useState(false);

  /**
   * Donante seleccionado para editar.
   *
   * Cuando es null, el formulario registra
   * un nuevo donante.
   */
  const [
    donanteEditando,
    setDonanteEditando
  ] = useState<Donante | null>(null);

  /**
   * Campos del formulario.
   */
  const [nombre, setNombre] = useState('');

  const [
    tipoDonante,
    setTipoDonante
  ] = useState<TipoDonante>('PERSONA');

  const [
    identificacion,
    setIdentificacion
  ] = useState('');

  const [
    telefono,
    setTelefono
  ] = useState('');

  const [
    correo,
    setCorreo
  ] = useState('');

  const [
    direccion,
    setDireccion
  ] = useState('');

  const [
    observaciones,
    setObservaciones
  ] = useState('');

  /**
   * ============================================================
   * NORMALIZAR TIPO DE DONANTE
   * ============================================================
   */
  const normalizarTipoDonante = (
    valor?: string | null
  ): TipoDonante => {

    const tipoNormalizado =
      String(valor ?? '')
        .normalize('NFD')
        .replace(
          /[\u0300-\u036f]/g,
          ''
        )
        .trim()
        .toUpperCase();

    if (
      TIPOS_DONANTE.includes(
        tipoNormalizado as TipoDonante
      )
    ) {
      return tipoNormalizado as TipoDonante;
    }

    return 'PERSONA';
  };

  /**
   * ============================================================
   * NORMALIZAR DONANTE RECIBIDO DE LA API
   * ============================================================
   *
   * Convierte la respuesta del backend en una estructura única.
   * También elimina espacios accidentales en nombre y campos.
   */
  const normalizarDonanteApi = (
    item: DonanteApi
  ): Donante | null => {

    const idDonante =
      Number(item.id_donante);

    if (
      !Number.isInteger(idDonante) ||
      idDonante <= 0
    ) {
      return null;
    }

    const nombreNormalizado =
      String(
        item.nombre ??
        item.nombre_donante ??
        ''
      ).trim();

    return {
      id_donante: idDonante,
      nombre:
        nombreNormalizado ||
        `Donante #${idDonante}`,
      tipo_donante:
        normalizarTipoDonante(
          item.tipo_donante ??
          item.tipo
        ),
      identificacion:
        item.identificacion?.trim() ||
        null,
      telefono:
        item.telefono?.trim() ||
        null,
      correo:
        item.correo?.trim() ||
        null,
      direccion:
        item.direccion?.trim() ||
        null,
      observaciones:
        item.observaciones?.trim() ||
        null
    };
  };

  /**
   * ============================================================
   * CARGAR DONANTES AL ABRIR LA PANTALLA
   * ============================================================
   */
  useEffect(() => {

    obtenerDonantes(true);

  }, []);

  /**
   * ============================================================
   * MOSTRAR MENSAJE
   * ============================================================
   */
  const mostrarMensaje = (
    titulo: string,
    mensaje: string
  ) => {

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
   * OBTENER DONANTES
   * ============================================================
   */
  const obtenerDonantes = async (
    mostrarCarga = true
  ) => {

    try {

      if (mostrarCarga) {

        setCargando(true);

      } else {

        setActualizando(true);
      }

      /**
       * El parámetro evita que el navegador reutilice
       * una respuesta GET anterior después de editar.
       */
      const response =
        await api.get(
          '/donantes',
          {
            params: {
              _actualizacion:
                Date.now()
            }
          }
        );

      const listaDonantes:
        DonanteApi[] =
          response.data?.data ??
          response.data?.donantes ??
          [];

      const donantesNormalizados =
        Array.isArray(listaDonantes)
          ? listaDonantes
              .map(normalizarDonanteApi)
              .filter(
                (
                  item
                ): item is Donante =>
                  item !== null
              )
          : [];

      /**
       * Evita mostrar dos tarjetas con el mismo ID.
       * La última fila recibida reemplaza la anterior.
       */
      const donantesUnicos =
        Array.from(
          new Map(
            donantesNormalizados.map(
              (item) => [
                item.id_donante,
                item
              ]
            )
          ).values()
        );

      setDonantes(
        donantesUnicos
      );

    } catch (error: any) {

      console.log(
        'Error al obtener donantes:',
        error?.response?.data ??
        error?.message ??
        error
      );

      mostrarMensaje(
        'Error',
        error?.response?.data?.mensaje ??
        error?.response?.data?.message ??
        'No se pudieron cargar los donantes.'
      );

    } finally {

      setCargando(false);
      setActualizando(false);
    }
  };

  /**
   * ============================================================
   * NORMALIZAR TEXTO
   * ============================================================
   *
   * Permite buscar sin importar:
   *
   * - Mayúsculas.
   * - Minúsculas.
   * - Acentos.
   */
  const normalizarTexto = (
    valor?: string | number | null
  ) => {

    return String(valor ?? '')
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        ''
      )
      .trim()
      .toLowerCase();
  };

  /**
   * ============================================================
   * FILTRAR DONANTES
   * ============================================================
   */
  const donantesFiltrados =
    useMemo(() => {

      const texto =
        normalizarTexto(busqueda);

      if (!texto) {

        return donantes;
      }

      return donantes.filter(
        (donante) => {

          return (
            normalizarTexto(
              donante.nombre
            ).includes(texto) ||

            normalizarTexto(
              donante.tipo_donante
            ).includes(texto) ||

            normalizarTexto(
              donante.identificacion
            ).includes(texto) ||

            normalizarTexto(
              donante.telefono
            ).includes(texto) ||

            normalizarTexto(
              donante.correo
            ).includes(texto) ||

            normalizarTexto(
              donante.direccion
            ).includes(texto)
          );
        }
      );

    }, [
      busqueda,
      donantes
    ]);

  /**
   * ============================================================
   * LIMPIAR FORMULARIO
   * ============================================================
   */
  const limpiarFormulario = () => {

    setNombre('');
    setTipoDonante('PERSONA');
    setIdentificacion('');
    setTelefono('');
    setCorreo('');
    setDireccion('');
    setObservaciones('');
    setDonanteEditando(null);
  };

  /**
   * ============================================================
   * ABRIR FORMULARIO PARA REGISTRAR
   * ============================================================
   */
  const abrirFormularioNuevo = () => {

    limpiarFormulario();
    setModalVisible(true);
  };

  /**
   * ============================================================
   * ABRIR FORMULARIO PARA EDITAR
   * ============================================================
   */
  const abrirFormularioEditar = (
    donante: Donante
  ) => {

    setDonanteEditando(donante);

    setNombre(
      donante.nombre ?? ''
    );

    setTipoDonante(
      donante.tipo_donante ?? 'PERSONA'
    );

    setIdentificacion(
      donante.identificacion ?? ''
    );

    setTelefono(
      donante.telefono ?? ''
    );

    setCorreo(
      donante.correo ?? ''
    );

    setDireccion(
      donante.direccion ?? ''
    );

    setObservaciones(
      donante.observaciones ?? ''
    );

    setModalVisible(true);
  };

  /**
   * ============================================================
   * CERRAR FORMULARIO
   * ============================================================
   */
  const cerrarFormulario = () => {

    if (guardando) {
      return;
    }

    setModalVisible(false);
    limpiarFormulario();
  };

  /**
   * ============================================================
   * VALIDAR CORREO
   * ============================================================
   */
  const correoEsValido = (
    valor: string
  ) => {

    const expresionCorreo =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return expresionCorreo.test(
      valor
    );
  };

  /**
   * ============================================================
   * VALIDAR FORMULARIO
   * ============================================================
   */
  const validarFormulario = () => {

    const nombreLimpio =
      nombre.trim();

    const correoLimpio =
      correo.trim().toLowerCase();

    if (!nombreLimpio) {

      mostrarMensaje(
        'Validación',
        'Ingrese el nombre del donante.'
      );

      return false;
    }

    if (nombreLimpio.length < 2) {

      mostrarMensaje(
        'Validación',
        'El nombre debe contener al menos 2 caracteres.'
      );

      return false;
    }

    if (
      tipoDonante === 'ANONIMO' &&
      nombreLimpio.toLowerCase() === ''
    ) {

      mostrarMensaje(
        'Validación',
        'Ingrese un nombre de referencia para el donante anónimo.'
      );

      return false;
    }

    if (
      correoLimpio &&
      !correoEsValido(correoLimpio)
    ) {

      mostrarMensaje(
        'Validación',
        'Ingrese un correo electrónico válido.'
      );

      return false;
    }

    if (
      telefono.trim() &&
      telefono.trim().length < 8
    ) {

      mostrarMensaje(
        'Validación',
        'El teléfono debe contener al menos 8 caracteres.'
      );

      return false;
    }

    return true;
  };

  /**
   * ============================================================
   * GUARDAR DONANTE
   * ============================================================
   *
   * Si donanteEditando es null:
   *
   * POST /donantes
   *
   * Si existe un donante seleccionado:
   *
   * PUT /donantes/:id
   */
  const guardarDonante = async () => {

    if (!validarFormulario()) {
      return;
    }

    const datosDonante = {
      nombre: nombre.trim(),

      /**
       * `tipo` es el nombre real de la columna.
       * Se conserva `tipo_donante` temporalmente para
       * compatibilidad con controladores anteriores.
       */
      tipo:
        tipoDonante,

      tipo_donante:
        tipoDonante,

      identificacion:
        identificacion.trim() || null,

      telefono:
        telefono.trim() || null,

      correo:
        correo.trim().toLowerCase() ||
        null,

      direccion:
        direccion.trim() || null,

      observaciones:
        observaciones.trim() || null
    };

    try {

      setGuardando(true);

      const estabaEditando =
        donanteEditando !== null;

      if (donanteEditando) {

        await api.put(
          `/donantes/${donanteEditando.id_donante}`,
          datosDonante
        );

        /**
         * Actualización inmediata de la tarjeta.
         * Evita que React conserve el nombre anterior
         * mientras finaliza la nueva consulta.
         */
        setDonantes(
          (listaActual) =>
            listaActual.map(
              (item) =>
                item.id_donante ===
                donanteEditando.id_donante
                  ? {
                      ...item,
                      nombre:
                        datosDonante.nombre,
                      tipo_donante:
                        tipoDonante,
                      identificacion:
                        datosDonante.identificacion,
                      telefono:
                        datosDonante.telefono,
                      correo:
                        datosDonante.correo,
                      direccion:
                        datosDonante.direccion,
                      observaciones:
                        datosDonante.observaciones
                    }
                  : item
            )
        );

      } else {

        await api.post(
          '/donantes',
          datosDonante
        );
      }

      /**
       * Se cierra el modal antes de mostrar el mensaje.
       * Esto reduce la advertencia aria-hidden en web.
       */
      setModalVisible(false);
      limpiarFormulario();

      await obtenerDonantes(false);

      mostrarMensaje(
        'Éxito',
        estabaEditando
          ? 'Donante actualizado correctamente.'
          : 'Donante registrado correctamente.'
      );

    } catch (error: any) {

      console.log(
        'Error al guardar donante:',
        error?.response?.data ??
        error?.message ??
        error
      );

      mostrarMensaje(
        'Error',
        error?.response?.data?.mensaje ??
        error?.response?.data?.message ??
        (
          donanteEditando
            ? 'No se pudo actualizar el donante.'
            : 'No se pudo registrar el donante.'
        )
      );

    } finally {

      setGuardando(false);
    }
  };

  /**
   * ============================================================
   * EJECUTAR ELIMINACIÓN
   * ============================================================
   */
  const ejecutarEliminacion = async (
    donante: Donante
  ) => {

    try {

      await api.delete(
        `/donantes/${donante.id_donante}`
      );

      setDonantes(
        (listaActual) =>
          listaActual.filter(
            (item) =>
              item.id_donante !==
              donante.id_donante
          )
      );

      mostrarMensaje(
        'Éxito',
        'Donante eliminado correctamente.'
      );

    } catch (error: any) {

      console.log(
        'Error al eliminar donante:',
        error?.response?.data ??
        error?.message ??
        error
      );

      mostrarMensaje(
        'Error',
        error?.response?.data?.mensaje ??
        error?.response?.data?.message ??
        'No se pudo eliminar el donante.'
      );
    }
  };

  /**
   * ============================================================
   * CONFIRMAR ELIMINACIÓN
   * ============================================================
   */
  const eliminarDonante = (
    donante: Donante
  ) => {

    const mensaje =
      `¿Desea eliminar al donante "${donante.nombre}"?`;

    if (
      Platform.OS === 'web' &&
      typeof window !== 'undefined'
    ) {

      const confirmado =
        window.confirm(mensaje);

      if (confirmado) {

        ejecutarEliminacion(donante);
      }

      return;
    }

    Alert.alert(
      'Confirmar eliminación',
      mensaje,
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Eliminar',
          style: 'destructive',

          onPress: () =>
            ejecutarEliminacion(donante)
        }
      ]
    );
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
          color="#0D3B66"
        />

        <Text style={styles.textoCargando}>
          Cargando donantes...
        </Text>

      </View>
    );
  }

  return (

    <View style={styles.container}>

      {/* Botón volver */}

      <TouchableOpacity
        style={styles.botonVolver}
        onPress={() =>
          router.back()
        }
      >

        <Text style={styles.textoBoton}>
          ⬅ Volver
        </Text>

      </TouchableOpacity>

      {/* Encabezado */}

      <View style={styles.encabezado}>

        <Text style={styles.titulo}>
          🤝 Donantes
        </Text>

        <Text style={styles.descripcion}>
          Administración de personas, empresas e instituciones donantes
        </Text>

      </View>

      {/* Campo de búsqueda */}

      <TextInput
        style={styles.inputBusqueda}
        value={busqueda}
        onChangeText={setBusqueda}
        placeholder="Buscar por nombre, identificación, teléfono o correo"
        placeholderTextColor="#888888"
        autoCapitalize="none"
        autoCorrect={false}
      />

      {/* Acciones */}

      <View style={styles.filaAcciones}>

        <TouchableOpacity
          style={styles.botonAgregar}
          onPress={abrirFormularioNuevo}
        >

          <Text style={styles.textoBoton}>
            ＋ Agregar donante
          </Text>

        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botonActualizar}
          onPress={() =>
            obtenerDonantes(false)
          }
          disabled={actualizando}
        >

          {
            actualizando ? (

              <ActivityIndicator
                color="#FFFFFF"
              />

            ) : (

              <Text style={styles.textoBoton}>
                ↻
              </Text>
            )
          }

        </TouchableOpacity>

      </View>

      {/* Total */}

      <Text style={styles.totalResultados}>
        Donantes encontrados:{' '}
        {donantesFiltrados.length}
      </Text>

      {/* Lista */}

      <FlatList
        data={donantesFiltrados}

        keyExtractor={(item) =>
          [
            item.id_donante,
            item.nombre,
            item.tipo_donante
          ].join('-')
        }

        extraData={donantesFiltrados}

        removeClippedSubviews={false}

        showsVerticalScrollIndicator={false}

        contentContainerStyle={
          donantesFiltrados.length === 0
            ? styles.listaVacia
            : styles.contenidoLista
        }

        refreshControl={

          <RefreshControl
            refreshing={actualizando}
            onRefresh={() =>
              obtenerDonantes(false)
            }
          />
        }

        renderItem={({ item }) => (

          <View style={styles.tarjeta}>

            <View style={styles.encabezadoTarjeta}>

              <View style={styles.contenedorNombre}>

                <Text style={styles.nombre}>
                  {item.nombre}
                </Text>

                <Text style={styles.identificador}>
                  Donante #{item.id_donante}
                </Text>

              </View>

              <View style={styles.tipoDonante}>

                <Text style={styles.textoTipoDonante}>
                  {item.tipo_donante}
                </Text>

              </View>

            </View>

            <Dato
              etiqueta="Identificación"
              valor={
                item.identificacion ||
                'No registrada'
              }
            />

            <Dato
              etiqueta="Teléfono"
              valor={
                item.telefono ||
                'No registrado'
              }
            />

            <Dato
              etiqueta="Correo"
              valor={
                item.correo ||
                'No registrado'
              }
            />

            <Dato
              etiqueta="Dirección"
              valor={
                item.direccion ||
                'No registrada'
              }
            />

            <Dato
              etiqueta="Observaciones"
              valor={
                item.observaciones ||
                'Sin observaciones'
              }
            />

            <View style={styles.filaBotones}>

              <TouchableOpacity
                style={styles.botonEditar}
                onPress={() =>
                  abrirFormularioEditar(item)
                }
              >

                <Text style={styles.textoBoton}>
                  Editar
                </Text>

              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botonEliminar}
                onPress={() =>
                  eliminarDonante(item)
                }
              >

                <Text style={styles.textoBoton}>
                  Eliminar
                </Text>

              </TouchableOpacity>

            </View>

          </View>
        )}

        ListEmptyComponent={

          <View style={styles.contenedorSinDatos}>

            <Text style={styles.iconoSinDatos}>
              🤝
            </Text>

            <Text style={styles.sinDatos}>
              No se encontraron donantes.
            </Text>

            <Text style={styles.ayudaSinDatos}>
              Agregue un donante o cambie el texto de búsqueda.
            </Text>

          </View>
        }
      />

      {/* Formulario modal */}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={
          cerrarFormulario
        }
      >

        <KeyboardAvoidingView
          style={styles.fondoModal}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >

          <View style={styles.modal}>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >

              <Text style={styles.tituloModal}>
                {
                  donanteEditando
                    ? 'Editar Donante'
                    : 'Nuevo Donante'
                }
              </Text>

              <Text style={styles.subtituloModal}>
                Complete la información solicitada
              </Text>

              <Text style={styles.etiquetaFormulario}>
                Nombre *
              </Text>

              <TextInput
                style={styles.input}
                value={nombre}
                onChangeText={setNombre}
                placeholder="Nombre del donante"
                placeholderTextColor="#999999"
                maxLength={150}
              />

              <Text style={styles.etiquetaFormulario}>
                Tipo de donante *
              </Text>

              <View style={styles.tipos}>

                {TIPOS_DONANTE.map(
                  (tipo) => {

                    const seleccionado =
                      tipoDonante === tipo;

                    return (

                      <TouchableOpacity
                        key={tipo}
                        style={[
                          styles.botonTipo,

                          seleccionado &&
                          styles.tipoSeleccionado
                        ]}
                        onPress={() =>
                          setTipoDonante(tipo)
                        }
                      >

                        <Text
                          style={[
                            styles.textoTipo,

                            seleccionado &&
                            styles.textoTipoSeleccionado
                          ]}
                        >
                          {tipo}
                        </Text>

                      </TouchableOpacity>
                    );
                  }
                )}

              </View>

              <Text style={styles.etiquetaFormulario}>
                Identificación
              </Text>

              <TextInput
                style={styles.input}
                value={identificacion}
                onChangeText={setIdentificacion}
                placeholder="Cédula física, jurídica u otra"
                placeholderTextColor="#999999"
                maxLength={50}
              />

              <Text style={styles.etiquetaFormulario}>
                Teléfono
              </Text>

              <TextInput
                style={styles.input}
                value={telefono}
                onChangeText={setTelefono}
                placeholder="Ejemplo: 8888-8888"
                placeholderTextColor="#999999"
                keyboardType="phone-pad"
                maxLength={30}
              />

              <Text style={styles.etiquetaFormulario}>
                Correo
              </Text>

              <TextInput
                style={styles.input}
                value={correo}
                onChangeText={setCorreo}
                placeholder="correo@ejemplo.com"
                placeholderTextColor="#999999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={150}
              />

              <Text style={styles.etiquetaFormulario}>
                Dirección
              </Text>

              <TextInput
                style={[
                  styles.input,
                  styles.areaDireccion
                ]}
                value={direccion}
                onChangeText={setDireccion}
                placeholder="Dirección del donante"
                placeholderTextColor="#999999"
                multiline
                textAlignVertical="top"
                maxLength={300}
              />

              <Text style={styles.etiquetaFormulario}>
                Observaciones
              </Text>

              <TextInput
                style={[
                  styles.input,
                  styles.areaTexto
                ]}
                value={observaciones}
                onChangeText={setObservaciones}
                placeholder="Información adicional"
                placeholderTextColor="#999999"
                multiline
                textAlignVertical="top"
                maxLength={500}
              />

              <TouchableOpacity
                style={[
                  styles.botonGuardar,

                  guardando &&
                  styles.botonDeshabilitado
                ]}
                onPress={guardarDonante}
                disabled={guardando}
              >

                {
                  guardando ? (

                    <ActivityIndicator
                      color="#FFFFFF"
                    />

                  ) : (

                    <Text style={styles.textoBoton}>
                      {
                        donanteEditando
                          ? 'Guardar cambios'
                          : 'Registrar donante'
                      }
                    </Text>
                  )
                }

              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botonCancelar}
                onPress={cerrarFormulario}
                disabled={guardando}
              >

                <Text style={styles.textoBoton}>
                  Cancelar
                </Text>

              </TouchableOpacity>

            </ScrollView>

          </View>

        </KeyboardAvoidingView>

      </Modal>

    </View>
  );
}

/**
 * ============================================================
 * COMPONENTE REUTILIZABLE: DATO
 * ============================================================
 */
function Dato({
  etiqueta,
  valor
}: {
  etiqueta: string;
  valor: string;
}) {

  return (

    <View style={styles.filaDato}>

      <Text style={styles.etiquetaDato}>
        {etiqueta}:
      </Text>

      <Text style={styles.valorDato}>
        {valor}
      </Text>

    </View>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: '#F5F1E8'
  },

  cargando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F1E8',
    padding: 20
  },

  textoCargando: {
    marginTop: 12,
    fontSize: 16,
    color: '#555555'
  },

  botonVolver: {
    alignSelf: 'flex-start',
    backgroundColor: '#0D3B66',
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginBottom: 20
  },

  textoBoton: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 15
  },

  encabezado: {
    backgroundColor: '#0D3B66',
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 18,
    marginBottom: 18
  },

  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#FFFFFF'
  },

  descripcion: {
    color: '#DCE6F0',
    textAlign: 'center',
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20
  },

  inputBusqueda: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 15,
    color: '#222222',
    marginBottom: 12
  },

  filaAcciones: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12
  },

  botonAgregar: {
    flex: 1,
    backgroundColor: '#198754',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 12,
    justifyContent: 'center'
  },

  botonActualizar: {
    width: 52,
    backgroundColor: '#6F42C1',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },

  totalResultados: {
    textAlign: 'center',
    color: '#555555',
    fontWeight: 'bold',
    marginBottom: 14
  },

  contenidoLista: {
    paddingBottom: 40
  },

  listaVacia: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 90
  },

  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 17,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E3E3E3',

    shadowColor: '#000000',

    shadowOffset: {
      width: 0,
      height: 2
    },

    shadowOpacity: 0.07,
    shadowRadius: 4,

    elevation: 2
  },

  encabezadoTarjeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14
  },

  contenedorNombre: {
    flex: 1
  },

  nombre: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#0D3B66'
  },

  identificador: {
    color: '#777777',
    fontSize: 12,
    marginTop: 4
  },

  tipoDonante: {
    backgroundColor: '#EAF4FF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 15
  },

  textoTipoDonante: {
    color: '#0D3B66',
    fontWeight: 'bold',
    fontSize: 11
  },

  filaDato: {
    marginBottom: 10
  },

  etiquetaDato: {
    color: '#333333',
    fontSize: 14,
    fontWeight: 'bold'
  },

  valorDato: {
    color: '#555555',
    fontSize: 15,
    marginTop: 3,
    lineHeight: 20
  },

  filaBotones: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10
  },

  botonEditar: {
    flex: 1,
    backgroundColor: '#D89C00',
    paddingVertical: 11,
    borderRadius: 9
  },

  botonEliminar: {
    flex: 1,
    backgroundColor: '#DC3545',
    paddingVertical: 11,
    borderRadius: 9
  },

  contenedorSinDatos: {
    alignItems: 'center',
    paddingHorizontal: 20
  },

  iconoSinDatos: {
    fontSize: 48,
    marginBottom: 10
  },

  sinDatos: {
    textAlign: 'center',
    color: '#555555',
    fontSize: 18,
    fontWeight: 'bold'
  },

  ayudaSinDatos: {
    textAlign: 'center',
    color: '#777777',
    fontSize: 14,
    marginTop: 7
  },

  fondoModal: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: 18
  },

  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    width: '100%',
    maxWidth: 650,
    maxHeight: '92%',
    alignSelf: 'center'
  },

  tituloModal: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#0D3B66'
  },

  subtituloModal: {
    textAlign: 'center',
    color: '#666666',
    marginTop: 5,
    marginBottom: 10
  },

  etiquetaFormulario: {
    color: '#333333',
    fontWeight: 'bold',
    marginTop: 13,
    marginBottom: 6
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: '#222222',
    fontSize: 15
  },

  areaDireccion: {
    minHeight: 75
  },

  areaTexto: {
    minHeight: 95
  },

  tipos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7
  },

  botonTipo: {
    backgroundColor: '#E9ECEF',
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 9
  },

  tipoSeleccionado: {
    backgroundColor: '#0D3B66'
  },

  textoTipo: {
    fontWeight: 'bold',
    color: '#333333',
    fontSize: 12
  },

  textoTipoSeleccionado: {
    color: '#FFFFFF'
  },

  botonGuardar: {
    backgroundColor: '#198754',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 22,
    minHeight: 48,
    justifyContent: 'center'
  },

  botonDeshabilitado: {
    opacity: 0.65
  },

  botonCancelar: {
    backgroundColor: '#6C757D',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 10
  }

});