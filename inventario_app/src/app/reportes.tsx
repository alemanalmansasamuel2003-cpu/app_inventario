import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';

import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from 'expo-router';

import * as XLSX from 'xlsx';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

import api from '../services/api';

/**
 * ============================================================
 * INTERFACES
 * ============================================================
 */

interface Producto {
  id_producto: number;
  nombre: string;
  descripcion?: string | null;
  cantidad: number;
  unidad_medida?: string | null;
  stock_minimo?: number | null;
  fecha_vencimiento?: string | null;
  nombre_categoria?: string | null;
  categoria?: string | null;
}

interface Movimiento {
  id_movimiento: number;
  tipo_movimiento: string;
  cantidad: number;
  fecha_movimiento?: string | null;
  motivo?: string | null;
  observaciones?: string | null;
  nombre_producto?: string | null;
  unidad_medida?: string | null;
  nombre_usuario?: string | null;
  nombre_donante?: string | null;
  existencia_anterior?: number | null;
  existencia_resultante?: number | null;
}

interface Donacion {
  id_donacion?: number;
  numero_documento?: string | null;
  fecha_donacion?: string | null;
  estado?: string | null;

  /**
   * El backend puede devolver cualquiera
   * de estos nombres según la consulta o vista SQL.
   */
  nombre_donante?: string | null;
  donante?: string | null;

  nombre_producto?: string | null;
  productos_donados?: string | null;

  cantidad?: number | null;
  total_unidades?: number | null;

  unidad_medida?: string | null;

  nombre_usuario?: string | null;
  registrado_por?: string | null;

  observaciones?: string | null;
}

interface Donante {
  id_donante: number;
  nombre: string;
  tipo?: string | null;
  telefono?: string | null;
  correo?: string | null;
  activo?: number | boolean | null;
}

interface Usuario {
  id_usuario: number;
  nombre: string;
  correo?: string | null;
  rol?: string | null;
  activo?: number | boolean | null;
}

interface DatosInforme {
  productos: Producto[];
  movimientos: Movimiento[];
  donaciones: Donacion[];
  donantes: Donante[];
  usuarios: Usuario[];
}

/**
 * ============================================================
 * FUNCIONES AUXILIARES
 * ============================================================
 */

const obtenerLista = <T,>(
  respuesta: any
): T[] => {

  if (Array.isArray(respuesta?.data?.data)) {
    return respuesta.data.data;
  }

  if (Array.isArray(respuesta?.data)) {
    return respuesta.data;
  }

  if (Array.isArray(respuesta)) {
    return respuesta;
  }

  return [];
};

const normalizarTexto = (
  valor?: string | null
): string => {

  return String(valor || '')
    .trim()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .toUpperCase();
};

const formatearNumero = (
  valor?: number | null
): string => {

  const numero =
    Number(valor || 0);

  return Number.isFinite(numero)
    ? numero.toLocaleString('es-CR')
    : '0';
};

const formatearFecha = (
  fecha?: string | null
): string => {

  if (!fecha) {
    return 'No registrada';
  }

  const fechaConvertida =
    new Date(fecha);

  if (
    Number.isNaN(
      fechaConvertida.getTime()
    )
  ) {
    return fecha;
  }

  return fechaConvertida
    .toLocaleString('es-CR');
};

const escaparHtml = (
  valor: unknown
): string => {

  return String(
    valor ?? ''
  )
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const crearNombreArchivo = (
  extension: 'xlsx' | 'pdf'
): string => {

  const fecha =
    new Date();

  const anio =
    fecha.getFullYear();

  const mes =
    String(
      fecha.getMonth() + 1
    ).padStart(2, '0');

  const dia =
    String(
      fecha.getDate()
    ).padStart(2, '0');

  const hora =
    String(
      fecha.getHours()
    ).padStart(2, '0');

  const minuto =
    String(
      fecha.getMinutes()
    ).padStart(2, '0');

  return (
    `reporte-inventario-${anio}${mes}${dia}-${hora}${minuto}.${extension}`
  );
};

/**
 * ============================================================
 * PANTALLA: INFORMES GENERALES
 * ============================================================
 */
export default function Reportes() {

  const parametros =
    useLocalSearchParams();

  const obtenerParametro = (
    valor:
      | string
      | string[]
      | undefined
  ): string => {

    if (Array.isArray(valor)) {
      return valor[0] || '';
    }

    return valor || '';
  };

  const nombreUsuario =
    obtenerParametro(
      parametros.nombre
    );

  const [
    datos,
    setDatos,
  ] = useState<DatosInforme>({
    productos: [],
    movimientos: [],
    donaciones: [],
    donantes: [],
    usuarios: [],
  });

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    actualizando,
    setActualizando,
  ] = useState(false);

  const [
    exportando,
    setExportando,
  ] = useState(false);

  /**
   * ============================================================
   * CARGAR INFORMACIÓN
   * ============================================================
   */
  const cargarInformacion =
    useCallback(
      async (
        refrescar = false
      ): Promise<void> => {

        try {

          if (refrescar) {
            setActualizando(true);
          } else {
            setCargando(true);
          }

          /**
           * Se utiliza Promise.allSettled para que el informe
           * continúe funcionando aunque una ruta no esté disponible.
           */
          const resultados =
            await Promise.allSettled([
              api.get('/productos'),
              api.get('/movimientos'),
              api.get('/movimientos/donaciones'),
              api.get('/donantes'),
              api.get('/usuarios'),
            ]);

          const obtenerResultado =
            (
              posicion: number
            ): any => {

              const resultado =
                resultados[posicion];

              return resultado.status ===
                'fulfilled'
                ? resultado.value
                : null;
            };

          const nuevosDatos: DatosInforme = {
            productos:
              obtenerLista<Producto>(
                obtenerResultado(0)
              ),

            movimientos:
              obtenerLista<Movimiento>(
                obtenerResultado(1)
              ),

            donaciones:
              obtenerLista<Donacion>(
                obtenerResultado(2)
              ),

            donantes:
              obtenerLista<Donante>(
                obtenerResultado(3)
              ),

            usuarios:
              obtenerLista<Usuario>(
                obtenerResultado(4)
              ),
          };

          setDatos(nuevosDatos);

          const rutasConError =
            resultados.filter(
              (resultado) =>
                resultado.status ===
                'rejected'
            ).length;

          if (rutasConError > 0) {

            console.warn(
              `${rutasConError} sección(es) del informe no pudieron cargarse.`,
              resultados
            );
          }

        } catch (error: any) {

          console.error(
            'Error al cargar informes:',
            error?.response?.data ||
            error?.message ||
            error
          );

          Alert.alert(
            'Error',
            error?.response?.data?.message ||
            error?.response?.data?.mensaje ||
            'No se pudo cargar la información de los informes.'
          );

        } finally {

          setCargando(false);
          setActualizando(false);
        }
      },
      []
    );

  useFocusEffect(
    useCallback(() => {

      cargarInformacion();

    }, [cargarInformacion])
  );

  /**
   * ============================================================
   * INDICADORES
   * ============================================================
   */
  const indicadores =
    useMemo(() => {

      const totalProductos =
        datos.productos.length;

      const totalUnidades =
        datos.productos.reduce(
          (
            acumulado,
            producto
          ) =>
            acumulado +
            Number(
              producto.cantidad || 0
            ),
          0
        );

      const productosStockBajo =
        datos.productos.filter(
          (producto) =>
            Number(
              producto.cantidad || 0
            ) <=
            Number(
              producto.stock_minimo || 0
            )
        );

      const entradas =
        datos.movimientos.filter(
          (movimiento) =>
            normalizarTexto(
              movimiento.tipo_movimiento
            ) === 'ENTRADA'
        );

      const salidas =
        datos.movimientos.filter(
          (movimiento) =>
            normalizarTexto(
              movimiento.tipo_movimiento
            ) === 'SALIDA'
        );

      const unidadesEntrada =
        entradas.reduce(
          (
            acumulado,
            movimiento
          ) =>
            acumulado +
            Number(
              movimiento.cantidad || 0
            ),
          0
        );

      const unidadesSalida =
        salidas.reduce(
          (
            acumulado,
            movimiento
          ) =>
            acumulado +
            Number(
              movimiento.cantidad || 0
            ),
          0
        );

      return {
        totalProductos,
        totalUnidades,
        stockBajo:
          productosStockBajo.length,
        totalMovimientos:
          datos.movimientos.length,
        totalEntradas:
          entradas.length,
        totalSalidas:
          salidas.length,
        unidadesEntrada,
        unidadesSalida,
        totalDonaciones:
          datos.donaciones.length,
        totalDonantes:
          datos.donantes.length,
        totalUsuarios:
          datos.usuarios.length,
      };

    }, [datos]);

  const productosStockBajo =
    useMemo(() => {

      return datos.productos.filter(
        (producto) =>
          Number(
            producto.cantidad || 0
          ) <=
          Number(
            producto.stock_minimo || 0
          )
      );

    }, [datos.productos]);

  const proximosVencer =
    useMemo(() => {

      const hoy =
        new Date();

      const limite =
        new Date();

      limite.setDate(
        hoy.getDate() + 30
      );

      return datos.productos.filter(
        (producto) => {

          if (
            !producto.fecha_vencimiento
          ) {
            return false;
          }

          const fecha =
            new Date(
              producto.fecha_vencimiento
            );

          return (
            !Number.isNaN(
              fecha.getTime()
            ) &&
            fecha >= hoy &&
            fecha <= limite
          );
        }
      );

    }, [datos.productos]);

  /**
   * ============================================================
   * EXPORTAR EXCEL
   * ============================================================
   */
  const exportarExcel =
    async (): Promise<void> => {

      try {

        setExportando(true);

        const libro =
          XLSX.utils.book_new();

        const resumen = [
          {
            Indicador:
              'Total de productos',
            Valor:
              indicadores.totalProductos,
          },
          {
            Indicador:
              'Total de unidades',
            Valor:
              indicadores.totalUnidades,
          },
          {
            Indicador:
              'Productos con stock bajo',
            Valor:
              indicadores.stockBajo,
          },
          {
            Indicador:
              'Total de movimientos',
            Valor:
              indicadores.totalMovimientos,
          },
          {
            Indicador:
              'Movimientos de entrada',
            Valor:
              indicadores.totalEntradas,
          },
          {
            Indicador:
              'Movimientos de salida',
            Valor:
              indicadores.totalSalidas,
          },
          {
            Indicador:
              'Unidades ingresadas',
            Valor:
              indicadores.unidadesEntrada,
          },
          {
            Indicador:
              'Unidades retiradas',
            Valor:
              indicadores.unidadesSalida,
          },
          {
            Indicador:
              'Total de donaciones',
            Valor:
              indicadores.totalDonaciones,
          },
          {
            Indicador:
              'Total de donantes',
            Valor:
              indicadores.totalDonantes,
          },
          {
            Indicador:
              'Total de usuarios',
            Valor:
              indicadores.totalUsuarios,
          },
        ];

        const productos =
          datos.productos.map(
            (producto) => ({
              ID:
                producto.id_producto,

              Producto:
                producto.nombre,

              Descripción:
                producto.descripcion || '',

              Cantidad:
                Number(
                  producto.cantidad || 0
                ),

              Unidad:
                producto.unidad_medida || '',

              'Stock mínimo':
                Number(
                  producto.stock_minimo || 0
                ),

              Categoría:
                producto.nombre_categoria ||
                producto.categoria ||
                '',

              Vencimiento:
                producto.fecha_vencimiento
                  ? formatearFecha(
                      producto.fecha_vencimiento
                    )
                  : '',
            })
          );

        const movimientos =
          datos.movimientos.map(
            (movimiento) => ({
              ID:
                movimiento.id_movimiento,

              Tipo:
                normalizarTexto(
                  movimiento.tipo_movimiento
                ),

              Producto:
                movimiento.nombre_producto ||
                '',

              Cantidad:
                Number(
                  movimiento.cantidad || 0
                ),

              Unidad:
                movimiento.unidad_medida ||
                '',

              Motivo:
                movimiento.motivo ||
                '',

              Detalle:
                movimiento.observaciones ||
                '',

              Usuario:
                movimiento.nombre_usuario ||
                '',

              Donante:
                movimiento.nombre_donante ||
                '',

              'Existencia anterior':
                movimiento.existencia_anterior ??
                '',

              'Existencia resultante':
                movimiento.existencia_resultante ??
                '',

              Fecha:
                formatearFecha(
                  movimiento.fecha_movimiento
                ),
            })
          );

        const donaciones =
          datos.donaciones.map(
            (donacion) => ({
              ID:
                donacion.id_donacion ??
                '',

              Documento:
                donacion.numero_documento ||
                '',

              Donante:
                donacion.nombre_donante ||
                donacion.donante ||
                'No registrado',

              'Productos donados':
                donacion.productos_donados ||
                donacion.nombre_producto ||
                'No registrados',

              'Total unidades':
                Number(
                  donacion.total_unidades ??
                  donacion.cantidad ??
                  0
                ),

              Estado:
                donacion.estado ||
                '',

              'Registrado por':
                donacion.nombre_usuario ||
                donacion.registrado_por ||
                'No registrado',

              Fecha:
                formatearFecha(
                  donacion.fecha_donacion
                ),
            })
          );

        const donantes =
          datos.donantes.map(
            (donante) => ({
              ID:
                donante.id_donante,

              Nombre:
                donante.nombre,

              Tipo:
                donante.tipo ||
                '',

              Teléfono:
                donante.telefono ||
                '',

              Correo:
                donante.correo ||
                '',

              Estado:
                Number(
                  donante.activo
                ) === 0
                  ? 'Inactivo'
                  : 'Activo',
            })
          );

        const usuarios =
          datos.usuarios.map(
            (usuario) => ({
              ID:
                usuario.id_usuario,

              Nombre:
                usuario.nombre,

              Correo:
                usuario.correo ||
                '',

              Rol:
                usuario.rol ||
                '',

              Estado:
                Number(
                  usuario.activo
                ) === 0
                  ? 'Inactivo'
                  : 'Activo',
            })
          );

        const agregarHoja = (
          nombre: string,
          registros: any[]
        ) => {

          const hoja =
            XLSX.utils.json_to_sheet(
              registros.length > 0
                ? registros
                : [{
                    Información:
                      'No hay registros',
                  }]
            );

          XLSX.utils.book_append_sheet(
            libro,
            hoja,
            nombre
          );
        };

        agregarHoja(
          'Resumen',
          resumen
        );

        agregarHoja(
          'Productos',
          productos
        );

        agregarHoja(
          'Movimientos',
          movimientos
        );

        agregarHoja(
          'Donaciones',
          donaciones
        );

        agregarHoja(
          'Donantes',
          donantes
        );

        agregarHoja(
          'Usuarios',
          usuarios
        );

        const nombreArchivo =
          crearNombreArchivo('xlsx');

        if (
          Platform.OS === 'web'
        ) {

          XLSX.writeFile(
            libro,
            nombreArchivo
          );

        } else {

          const base64 =
            XLSX.write(
              libro,
              {
                type: 'base64',
                bookType: 'xlsx',
              }
            );

          const ruta =
            `${
              FileSystem.cacheDirectory
            }${nombreArchivo}`;

          await FileSystem
            .writeAsStringAsync(
              ruta,
              base64,
              {
                encoding:
                  FileSystem
                    .EncodingType
                    .Base64,
              }
            );

          const disponible =
            await Sharing
              .isAvailableAsync();

          if (disponible) {

            await Sharing
              .shareAsync(
                ruta,
                {
                  mimeType:
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

                  dialogTitle:
                    'Guardar reporte de Excel',

                  UTI:
                    'org.openxmlformats.spreadsheetml.sheet',
                }
              );

          } else {

            Alert.alert(
              'Reporte generado',
              `El archivo fue guardado en: ${ruta}`
            );
          }
        }

        Alert.alert(
          'Reporte generado',
          'El reporte de Excel se generó correctamente.'
        );

      } catch (error: any) {

        console.error(
          'Error al exportar Excel:',
          error
        );

        Alert.alert(
          'Error',
          error?.message ||
          'No se pudo generar el reporte de Excel.'
        );

      } finally {

        setExportando(false);
      }
    };

  /**
   * ============================================================
   * CREAR HTML DEL PDF
   * ============================================================
   */
  const crearHtmlReporte =
    (): string => {

      const filasProductos =
        datos.productos.map(
          (producto) => `
            <tr>
              <td>${escaparHtml(producto.id_producto)}</td>
              <td>${escaparHtml(producto.nombre)}</td>
              <td>${escaparHtml(producto.cantidad)}</td>
              <td>${escaparHtml(producto.unidad_medida || '')}</td>
              <td>${escaparHtml(producto.stock_minimo || 0)}</td>
              <td>${escaparHtml(
                producto.nombre_categoria ||
                producto.categoria ||
                ''
              )}</td>
            </tr>
          `
        ).join('');

      const filasMovimientos =
        datos.movimientos.map(
          (movimiento) => `
            <tr>
              <td>${escaparHtml(movimiento.id_movimiento)}</td>
              <td>${escaparHtml(
                normalizarTexto(
                  movimiento.tipo_movimiento
                )
              )}</td>
              <td>${escaparHtml(movimiento.nombre_producto || '')}</td>
              <td>${escaparHtml(movimiento.cantidad)}</td>
              <td>${escaparHtml(movimiento.motivo || '')}</td>
              <td>${escaparHtml(movimiento.nombre_usuario || '')}</td>
              <td>${escaparHtml(
                formatearFecha(
                  movimiento.fecha_movimiento
                )
              )}</td>
            </tr>
          `
        ).join('');

      const filasDonaciones =
        datos.donaciones.map(
          (donacion) => `
            <tr>
              <td>${escaparHtml(
                donacion.id_donacion ?? ''
              )}</td>

              <td>${escaparHtml(
                donacion.numero_documento ||
                ''
              )}</td>

              <td>${escaparHtml(
                donacion.nombre_donante ||
                donacion.donante ||
                'No registrado'
              )}</td>

              <td>${escaparHtml(
                donacion.productos_donados ||
                donacion.nombre_producto ||
                'No registrados'
              )}</td>

              <td>${escaparHtml(
                donacion.total_unidades ??
                donacion.cantidad ??
                0
              )}</td>

              <td>${escaparHtml(
                donacion.estado ||
                ''
              )}</td>

              <td>${escaparHtml(
                donacion.nombre_usuario ||
                donacion.registrado_por ||
                'No registrado'
              )}</td>

              <td>${escaparHtml(
                formatearFecha(
                  donacion.fecha_donacion
                )
              )}</td>
            </tr>
          `
        ).join('');

      return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <style>
            @page {
              size: A4 landscape;
              margin: 20px;
            }

            body {
              font-family: Arial, sans-serif;
              color: #1D2939;
              font-size: 11px;
            }

            h1 {
              color: #0D3B66;
              text-align: center;
              margin-bottom: 4px;
            }

            h2 {
              color: #0D3B66;
              margin-top: 25px;
              border-bottom: 2px solid #0D3B66;
              padding-bottom: 5px;
            }

            .subtitulo {
              text-align: center;
              color: #667085;
              margin-bottom: 20px;
            }

            .resumen {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 8px;
            }

            .kpi {
              border: 1px solid #D0D5DD;
              border-radius: 8px;
              padding: 10px;
              text-align: center;
              background: #F4F7FB;
            }

            .numero {
              font-size: 20px;
              font-weight: bold;
              color: #0D3B66;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }

            th {
              background: #0D3B66;
              color: #FFFFFF;
              padding: 7px;
              text-align: left;
            }

            td {
              border: 1px solid #D0D5DD;
              padding: 6px;
            }

            tr:nth-child(even) {
              background: #F4F7FB;
            }

            .pie {
              margin-top: 25px;
              color: #667085;
              text-align: center;
            }
          </style>
        </head>

        <body>
          <h1>Informe General de Inventario</h1>

          <div class="subtitulo">
            Generado el ${escaparHtml(
              new Date().toLocaleString('es-CR')
            )}
            ${
              nombreUsuario
                ? ` por ${escaparHtml(nombreUsuario)}`
                : ''
            }
          </div>

          <div class="resumen">
            <div class="kpi">
              <div class="numero">${indicadores.totalProductos}</div>
              <div>Productos</div>
            </div>

            <div class="kpi">
              <div class="numero">${indicadores.totalUnidades}</div>
              <div>Unidades disponibles</div>
            </div>

            <div class="kpi">
              <div class="numero">${indicadores.stockBajo}</div>
              <div>Stock bajo</div>
            </div>

            <div class="kpi">
              <div class="numero">${indicadores.totalMovimientos}</div>
              <div>Movimientos</div>
            </div>

            <div class="kpi">
              <div class="numero">${indicadores.totalEntradas}</div>
              <div>Entradas</div>
            </div>

            <div class="kpi">
              <div class="numero">${indicadores.totalSalidas}</div>
              <div>Salidas</div>
            </div>

            <div class="kpi">
              <div class="numero">${indicadores.totalDonaciones}</div>
              <div>Donaciones</div>
            </div>

            <div class="kpi">
              <div class="numero">${indicadores.totalDonantes}</div>
              <div>Donantes</div>
            </div>
          </div>

          <h2>Productos</h2>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Unidad</th>
                <th>Stock mínimo</th>
                <th>Categoría</th>
              </tr>
            </thead>

            <tbody>
              ${
                filasProductos ||
                `
                  <tr>
                    <td colspan="6">
                      No hay productos registrados.
                    </td>
                  </tr>
                `
              }
            </tbody>
          </table>

          <h2>Movimientos</h2>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tipo</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Motivo</th>
                <th>Usuario</th>
                <th>Fecha</th>
              </tr>
            </thead>

            <tbody>
              ${
                filasMovimientos ||
                `
                  <tr>
                    <td colspan="7">
                      No hay movimientos registrados.
                    </td>
                  </tr>
                `
              }
            </tbody>
          </table>

          <h2>Donaciones recibidas</h2>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Documento</th>
                <th>Donante</th>
                <th>Productos donados</th>
                <th>Total unidades</th>
                <th>Estado</th>
                <th>Registrado por</th>
                <th>Fecha</th>
              </tr>
            </thead>

            <tbody>
              ${
                filasDonaciones ||
                `
                  <tr>
                    <td colspan="8">
                      No hay donaciones registradas.
                    </td>
                  </tr>
                `
              }
            </tbody>
          </table>

          <div class="pie">
            Sistema de Inventario del Hogar El Buen Samaritano
          </div>
        </body>
        </html>
      `;
    };

  /**
   * ============================================================
   * EXPORTAR PDF
   * ============================================================
   */
  const exportarPdf =
    async (): Promise<void> => {

      try {

        setExportando(true);

        const html =
          crearHtmlReporte();

        if (
          Platform.OS === 'web'
        ) {

          const ventana =
            window.open(
              '',
              '_blank'
            );

          if (!ventana) {

            throw new Error(
              'El navegador bloqueó la ventana del reporte. Permita las ventanas emergentes.'
            );
          }

          ventana.document.write(html);
          ventana.document.close();

          ventana.onload = () => {
            ventana.focus();
            ventana.print();
          };

        } else {

          const archivo =
            await Print
              .printToFileAsync({
                html,
                base64: false,
              });

          const disponible =
            await Sharing
              .isAvailableAsync();

          if (disponible) {

            await Sharing
              .shareAsync(
                archivo.uri,
                {
                  mimeType:
                    'application/pdf',

                  dialogTitle:
                    'Guardar reporte PDF',

                  UTI:
                    'com.adobe.pdf',
                }
              );

          } else {

            Alert.alert(
              'PDF generado',
              `El archivo fue guardado en: ${archivo.uri}`
            );
          }
        }

      } catch (error: any) {

        console.error(
          'Error al exportar PDF:',
          error
        );

        Alert.alert(
          'Error',
          error?.message ||
          'No se pudo generar el reporte PDF.'
        );

      } finally {

        setExportando(false);
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
          color="#0D3B66"
        />

        <Text style={styles.textoCargando}>
          Preparando informes...
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.contenido
      }
      refreshControl={
        <RefreshControl
          refreshing={
            actualizando
          }
          onRefresh={() =>
            cargarInformacion(true)
          }
          tintColor="#0D3B66"
          colors={[
            '#0D3B66',
          ]}
        />
      }
      showsVerticalScrollIndicator={false}
    >

      <TouchableOpacity
        style={styles.botonVolver}
        onPress={() =>
          router.back()
        }
      >
        <Text style={styles.textoBoton}>
          ← Volver
        </Text>
      </TouchableOpacity>

      <View style={styles.encabezado}>

        <Text style={styles.icono}>
          📊
        </Text>

        <Text style={styles.titulo}>
          Informes Generales
        </Text>

        <Text style={styles.subtitulo}>
          Resumen completo del sistema de inventario
        </Text>

      </View>

      <View style={styles.botonesExportar}>

        <TouchableOpacity
          style={[
            styles.botonExportar,
            styles.botonExcel,
          ]}
          onPress={
            exportarExcel
          }
          disabled={
            exportando
          }
        >
          <Text style={styles.textoBotonExportar}>
            📗 Descargar Excel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.botonExportar,
            styles.botonPdf,
          ]}
          onPress={
            exportarPdf
          }
          disabled={
            exportando
          }
        >
          <Text style={styles.textoBotonExportar}>
            📕 Descargar PDF
          </Text>
        </TouchableOpacity>

      </View>

      {exportando ? (

        <View style={styles.exportando}>

          <ActivityIndicator
            size="small"
            color="#0D3B66"
          />

          <Text style={styles.textoExportando}>
            Generando reporte...
          </Text>

        </View>

      ) : null}

      <Text style={styles.tituloSeccion}>
        Resumen general
      </Text>

      <View style={styles.cuadricula}>

        <Kpi
          icono="📦"
          titulo="Productos"
          valor={
            indicadores.totalProductos
          }
        />

        <Kpi
          icono="🔢"
          titulo="Unidades"
          valor={
            indicadores.totalUnidades
          }
        />

        <Kpi
          icono="⚠️"
          titulo="Stock bajo"
          valor={
            indicadores.stockBajo
          }
        />

        <Kpi
          icono="🔄"
          titulo="Movimientos"
          valor={
            indicadores.totalMovimientos
          }
        />

        <Kpi
          icono="📥"
          titulo="Entradas"
          valor={
            indicadores.totalEntradas
          }
        />

        <Kpi
          icono="📤"
          titulo="Salidas"
          valor={
            indicadores.totalSalidas
          }
        />

        <Kpi
          icono="🤝"
          titulo="Donaciones"
          valor={
            indicadores.totalDonaciones
          }
        />

        <Kpi
          icono="👥"
          titulo="Donantes"
          valor={
            indicadores.totalDonantes
          }
        />

        <Kpi
          icono="👤"
          titulo="Usuarios"
          valor={
            indicadores.totalUsuarios
          }
        />

      </View>

      <Text style={styles.tituloSeccion}>
        Balance de movimientos
      </Text>

      <View style={styles.tarjetaSeccion}>

        <FilaDato
          etiqueta="Unidades ingresadas"
          valor={
            formatearNumero(
              indicadores.unidadesEntrada
            )
          }
          destacado="entrada"
        />

        <FilaDato
          etiqueta="Unidades retiradas"
          valor={
            formatearNumero(
              indicadores.unidadesSalida
            )
          }
          destacado="salida"
        />

        <FilaDato
          etiqueta="Balance de unidades"
          valor={
            formatearNumero(
              indicadores.unidadesEntrada -
              indicadores.unidadesSalida
            )
          }
        />

      </View>

      <Text style={styles.tituloSeccion}>
        Productos con stock bajo
      </Text>

      <View style={styles.tarjetaSeccion}>

        {
          productosStockBajo.length > 0
            ? productosStockBajo
                .slice(0, 10)
                .map(
                  (producto) => (

                    <FilaProducto
                      key={
                        producto.id_producto
                      }
                      nombre={
                        producto.nombre
                      }
                      cantidad={
                        producto.cantidad
                      }
                      unidad={
                        producto.unidad_medida
                      }
                      detalle={
                        `Mínimo: ${
                          producto.stock_minimo ||
                          0
                        }`
                      }
                    />

                  )
                )
            : (
              <Text style={styles.sinDatos}>
                No hay productos con stock bajo.
              </Text>
            )
        }

      </View>

      <Text style={styles.tituloSeccion}>
        Próximos a vencer
      </Text>

      <View style={styles.tarjetaSeccion}>

        {
          proximosVencer.length > 0
            ? proximosVencer
                .slice(0, 10)
                .map(
                  (producto) => (

                    <FilaProducto
                      key={
                        producto.id_producto
                      }
                      nombre={
                        producto.nombre
                      }
                      cantidad={
                        producto.cantidad
                      }
                      unidad={
                        producto.unidad_medida
                      }
                      detalle={
                        formatearFecha(
                          producto.fecha_vencimiento
                        )
                      }
                    />

                  )
                )
            : (
              <Text style={styles.sinDatos}>
                No hay productos próximos a vencer en los siguientes 30 días.
              </Text>
            )
        }

      </View>

      <Text style={styles.tituloSeccion}>
        Últimos movimientos
      </Text>

      <View style={styles.tarjetaSeccion}>

        {
          datos.movimientos.length > 0
            ? datos.movimientos
                .slice(0, 10)
                .map(
                  (movimiento) => {

                    const esEntrada =
                      normalizarTexto(
                        movimiento.tipo_movimiento
                      ) === 'ENTRADA';

                    return (

                      <View
                        key={
                          movimiento.id_movimiento
                        }
                        style={styles.movimiento}
                      >

                        <View style={styles.movimientoEncabezado}>

                          <Text
                            style={[
                              styles.movimientoTipo,

                              esEntrada
                                ? styles.textoEntrada
                                : styles.textoSalida,
                            ]}
                          >
                            {
                              esEntrada
                                ? '📥 ENTRADA'
                                : '📤 SALIDA'
                            }
                          </Text>

                          <Text style={styles.movimientoFecha}>
                            {
                              formatearFecha(
                                movimiento.fecha_movimiento
                              )
                            }
                          </Text>

                        </View>

                        <Text style={styles.movimientoProducto}>
                          {
                            movimiento.nombre_producto ||
                            'Producto no registrado'
                          }
                        </Text>

                        <Text style={styles.movimientoDetalle}>
                          {
                            formatearNumero(
                              movimiento.cantidad
                            )
                          }{' '}
                          {
                            movimiento.unidad_medida ||
                            ''
                          }
                          {' · '}
                          {
                            movimiento.motivo ||
                            'Sin motivo'
                          }
                        </Text>

                      </View>
                    );
                  }
                )
            : (
              <Text style={styles.sinDatos}>
                No hay movimientos registrados.
              </Text>
            )
        }

      </View>

    </ScrollView>
  );
}

/**
 * ============================================================
 * COMPONENTES
 * ============================================================
 */

function Kpi({
  icono,
  titulo,
  valor,
}: {
  icono: string;
  titulo: string;
  valor: number;
}) {

  return (
    <View style={styles.kpi}>

      <Text style={styles.kpiIcono}>
        {icono}
      </Text>

      <Text style={styles.kpiValor}>
        {formatearNumero(valor)}
      </Text>

      <Text style={styles.kpiTitulo}>
        {titulo}
      </Text>

    </View>
  );
}

function FilaDato({
  etiqueta,
  valor,
  destacado,
}: {
  etiqueta: string;
  valor: string;
  destacado?:
    | 'entrada'
    | 'salida';
}) {

  return (
    <View style={styles.filaDato}>

      <Text style={styles.etiquetaDato}>
        {etiqueta}
      </Text>

      <Text
        style={[
          styles.valorDato,

          destacado === 'entrada'
            ? styles.textoEntrada
            : null,

          destacado === 'salida'
            ? styles.textoSalida
            : null,
        ]}
      >
        {valor}
      </Text>

    </View>
  );
}

function FilaProducto({
  nombre,
  cantidad,
  unidad,
  detalle,
}: {
  nombre: string;
  cantidad: number;
  unidad?: string | null;
  detalle: string;
}) {

  return (
    <View style={styles.filaProducto}>

      <View style={styles.productoInformacion}>

        <Text style={styles.productoNombre}>
          {nombre}
        </Text>

        <Text style={styles.productoDetalle}>
          {detalle}
        </Text>

      </View>

      <Text style={styles.productoCantidad}>
        {formatearNumero(cantidad)}{' '}
        {unidad || ''}
      </Text>

    </View>
  );
}

/**
 * ============================================================
 * ESTILOS
 * ============================================================
 */

const styles =
  StyleSheet.create({

    container: {
      flex: 1,
      backgroundColor: '#F4F7FB',
    },

    contenido: {
      width: '100%',
      maxWidth: 1100,
      alignSelf: 'center',
      padding: 18,
      paddingBottom: 45,
    },

    cargando: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F4F7FB',
    },

    textoCargando: {
      marginTop: 12,
      color: '#667085',
      fontSize: 16,
    },

    botonVolver: {
      alignSelf: 'flex-start',
      backgroundColor: '#0D6EFD',
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 10,
      marginBottom: 16,
    },

    textoBoton: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '800',
    },

    encabezado: {
      backgroundColor: '#0D3B66',
      borderRadius: 20,
      paddingVertical: 25,
      paddingHorizontal: 20,
      alignItems: 'center',
      marginBottom: 18,
    },

    icono: {
      fontSize: 42,
      marginBottom: 6,
    },

    titulo: {
      color: '#FFFFFF',
      fontSize: 29,
      fontWeight: '800',
      textAlign: 'center',
    },

    subtitulo: {
      color: '#DCE6F0',
      fontSize: 14,
      textAlign: 'center',
      marginTop: 6,
    },

    botonesExportar: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 15,
    },

    botonExportar: {
      flex: 1,
      minWidth: 200,
      paddingVertical: 14,
      paddingHorizontal: 15,
      borderRadius: 12,
      alignItems: 'center',
    },

    botonExcel: {
      backgroundColor: '#198754',
    },

    botonPdf: {
      backgroundColor: '#DC3545',
    },

    textoBotonExportar: {
      color: '#FFFFFF',
      fontWeight: '800',
      fontSize: 16,
    },

    exportando: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 14,
    },

    textoExportando: {
      marginLeft: 9,
      color: '#667085',
    },

    tituloSeccion: {
      color: '#0D3B66',
      fontSize: 21,
      fontWeight: '800',
      marginTop: 14,
      marginBottom: 11,
    },

    cuadricula: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },

    kpi: {
      flexGrow: 1,
      flexBasis: 155,
      minWidth: 145,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E3E8EF',
      borderRadius: 15,
      paddingVertical: 17,
      paddingHorizontal: 12,
      alignItems: 'center',

      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.06,
      shadowRadius: 5,
      elevation: 2,
    },

    kpiIcono: {
      fontSize: 28,
      marginBottom: 5,
    },

    kpiValor: {
      color: '#0D3B66',
      fontSize: 25,
      fontWeight: '800',
    },

    kpiTitulo: {
      color: '#667085',
      fontSize: 13,
      marginTop: 3,
      textAlign: 'center',
    },

    tarjetaSeccion: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E3E8EF',
      borderRadius: 15,
      padding: 16,

      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 2,
    },

    filaDato: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: '#EAECF0',
      paddingVertical: 12,
      gap: 12,
    },

    etiquetaDato: {
      flex: 1,
      color: '#344054',
      fontWeight: '700',
      fontSize: 15,
    },

    valorDato: {
      color: '#0D3B66',
      fontWeight: '800',
      fontSize: 16,
    },

    textoEntrada: {
      color: '#198754',
    },

    textoSalida: {
      color: '#DC3545',
    },

    filaProducto: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#EAECF0',
      gap: 12,
    },

    productoInformacion: {
      flex: 1,
    },

    productoNombre: {
      color: '#1D2939',
      fontSize: 15,
      fontWeight: '800',
    },

    productoDetalle: {
      color: '#667085',
      fontSize: 13,
      marginTop: 3,
    },

    productoCantidad: {
      color: '#0D3B66',
      fontWeight: '800',
      fontSize: 14,
      textAlign: 'right',
    },

    movimiento: {
      borderBottomWidth: 1,
      borderBottomColor: '#EAECF0',
      paddingVertical: 13,
    },

    movimientoEncabezado: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
    },

    movimientoTipo: {
      fontWeight: '800',
      fontSize: 14,
    },

    movimientoFecha: {
      color: '#667085',
      fontSize: 12,
    },

    movimientoProducto: {
      color: '#1D2939',
      fontWeight: '800',
      fontSize: 16,
      marginTop: 6,
    },

    movimientoDetalle: {
      color: '#475467',
      fontSize: 14,
      marginTop: 4,
    },

    sinDatos: {
      color: '#667085',
      textAlign: 'center',
      paddingVertical: 18,
      lineHeight: 21,
    },
  });