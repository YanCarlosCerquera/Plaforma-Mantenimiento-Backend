// Crear un archivo separado para la interfaz
export interface TecnicoOrdenesResponse {
    tecnico: {
      id: string
      nombre: string
      email: string
      telefono: string
      cargo: string
      documento: {
        tipo: string
        numero: string
      }
    }
    ordenes: Array<{
      id: string
      radicado: string
      fechaInicio: Date
      fechaFin: Date
      prioridad: string
      solicitud: {
        solicitudId: string
      }
      estado: boolean
      fechaCreacion: Date
      fechaActualizacion: Date

      activo : Array <{
nombre : string,
ubicacion : string
      }>
      mantenimientos: Array<{
        id: string
        tipo: string
        descripcion: string
        observacion: string
        estadoRepuestos: string
        detallesRepuestos?: string
        firmaDelTecnico: string
        fechaCreacion: Date
      }>
      informes: Array<{
        id: string
        costos: number
        horas: number
        respuestas: string
        observacion: string
        trabajoRealizado: string
        estado: boolean
        fechaCreacion: Date
      }>
    }>
    total: number
    totalMantenimientos: number
    totalInformes: number
  }
  
  