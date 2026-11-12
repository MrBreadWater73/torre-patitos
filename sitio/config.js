// Configuración de La torre de los patitos.
// 1) En Supabase: Project Settings → API Keys. Copia la "Project URL" y la llave publicable
//    (empieza con sb_publishable_). Esa llave está hecha para ir en el navegador.
// 2) Pégalas abajo y vuelve a subir la carpeta a Netlify.
// Si las dejas vacías, el juego funciona igual pero guarda las partidas solo en cada navegador.
window.TORRE_CONFIG = {
  SUPABASE_URL: 'https://heevsuzackjfcggcuqrq.supabase.co',   // ej. 'https://abcdefghijkl.supabase.co'
  SUPABASE_KEY: 'sb_publishable_SibIvZ1Dij95BKnHfvamzw_UeLewkAx',   // ej. 'sb_publishable_xxxxxxxxxxxxxxxx'

  // Ilustraciones opcionales (por ejemplo, generadas con Gemini). Pon las imágenes en la carpeta
  // arte/ y escribe la ruta. Vacío = se usa la ilustración dibujada por el juego.
  ART: {
    intro1: 'arte/intro-1.jpg',   // 'arte/intro-1.webp'  La familia Pata en el estanque municipal
    intro2: 'arte/intro-2.jpg',   // 'arte/intro-2.webp'  Entrega garantizada
    intro3: 'arte/intro-3.jpg',   // 'arte/intro-3.webp'  Las tres torres
    intro4: 'arte/intro-4.jpg',   // 'arte/intro-4.webp'  Pipo no vuela
    rescue1: 'arte/rescate-tina.jpg',  // 'arte/rescate-tina.webp'
    rescue2: 'arte/rescate-lalo.jpg',  // 'arte/rescate-lalo.webp'
    // Versión 2: escenas nuevas (prompts 8 a 12 de PROMPTS-GEMINI.md). Vacías = las dibuja el juego.
    rescue3: 'arte/rescate-mimi.jpg',   // 'arte/rescate-mimi.jpg'      Mimi y su libreta
    rescue4: 'arte/rescate-mama.jpg',   // 'arte/rescate-mama.jpg'      Mamá Pata sale del almacén
    rescue5: 'arte/rescate-huevo.jpg',   // 'arte/rescate-huevo.jpg'     Huevo sale del congelador
    rescue6: 'arte/rescate-servidor.jpg',   // 'arte/rescate-servidor.jpg'  rutas apagadas
    ending: 'arte/final-v2.jpg'    // versión 2, con Huevo (final.jpg es el cierre de la versión 1)
  }
};
