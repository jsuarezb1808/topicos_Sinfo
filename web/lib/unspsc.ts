/** UNSPSC segment (2 dígitos) → nombre en español (tabla estándar, resumida). */
const SEGMENTS: Record<string, string> = {
  '10': 'Material vivo animal y vegetal',
  '11': 'Minerales',
  '12': 'Material vegetal',
  '13': 'Materiales de rescate y desecho',
  '14': 'Materiales y productos de papel',
  '15': 'Materiales combustibles y lubricantes',
  '20': 'Maquinaria y accesorios',
  '22': 'Edificación y estructuras',
  '23': 'Infraestructura y edificaciones',
  '24': 'Equipos y suministros eléctricos',
  '25': 'Equipos comerciales y militares',
  '26': 'Equipos y suministros de laboratorio',
  '27': 'Equipos y suministros agrícolas',
  '30': 'Componentes y suministros de fabricación',
  '31': 'Componentes y suministros de fabricación',
  '32': 'Componentes y equipos electrónicos',
  '39': 'Componentes y suministros de limpieza',
  '40': 'Equipos y suministros de distribución',
  '41': 'Equipos y suministros de laboratorio',
  '42': 'Equipos y suministros médicos',
  '43': 'Hardware y servicios de TI',
  '44': 'Equipos de oficina y accesorios',
  '45': 'Equipos y suministros de impresión',
  '46': 'Equipos de defensa y seguridad',
  '47': 'Equipos de limpieza',
  '48': 'Maquinaria y accesorios para minería',
  '49': 'Equipos y suministros deportivos',
  '50': 'Alimentos, bebidas y tabaco',
  '51': 'Medicamentos y productos farmacéuticos',
  '52': 'Artículos domésticos y suministros',
  '53': 'Ropa, equipaje y productos personales',
  '54': 'Productos para relojería y joyería',
  '55': 'Publicaciones impresas',
  '56': 'Muebles y mobiliario',
  '60': 'Instrumentos musicales y juegos',
  '70': 'Servicios de contratación pública',
  '71': 'Servicios de minería y petróleo',
  '72': 'Servicios de construcción',
  '73': 'Servicios de producción industrial',
  '76': 'Servicios de limpieza',
  '77': 'Servicios medioambientales',
  '78': 'Servicios de transporte y almacenamiento',
  '80': 'Servicios de gestión y consultoría',
  '81': 'Servicios basados en ingeniería',
  '82': 'Servicios editoriales y de diseño',
  '83': 'Servicios públicos y servicios sociales',
  '84': 'Servicios financieros y de seguros',
  '85': 'Servicios de salud',
  '86': 'Servicios educativos y de formación',
  '90': 'Equipos y suministros de viaje',
  '91': 'Equipos y suministros personales',
  '92': 'Equipos y suministros de seguridad',
  '93': 'Servicios de alimentación',
  '94': 'Organizaciones y clubes',
  '95': 'Terrenos y edificios',
};

export function segmentLabel(segment: string): string {
  return SEGMENTS[segment] ?? `Sector ${segment}`;
}

export function segmentOptionLabel(segment: string, count?: number): string {
  const name = segmentLabel(segment);
  if (count != null) return `${segment} — ${name} (${count})`;
  return `${segment} — ${name}`;
}
