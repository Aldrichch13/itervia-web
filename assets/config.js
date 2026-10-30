// Configuración pública de la web. La anon key de Supabase es pública por diseño
// (las apps la traen dentro); la seguridad la ponen las policies (docs/notas-backend-ios.md).
// Sin anon key, la web corre en "modo demo" con assets/demo.json.
export const CONFIG = {
  supabaseUrl: 'https://ygxmtgmcbjduuzimeknx.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlneG10Z21jYmpkdXV6aW1la254Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1Nzg1MzksImV4cCI6MjA4NDE1NDUzOX0.dvej_lKIJ4K9m4lKs6JyWsw4liKPEKLouxcD2e4feMs', // anon public: solo lee lugares y perfiles públicos (S6b)
  appStoreId: '6758466804',
  appStoreUrl: 'https://apps.apple.com/mx/app/id6758466804',
  playStoreUrl: '', // vacío = "Android muy pronto"
  appScheme: 'itervia://',
  // Señales de popularidad: no mostrar contadores por debajo de esto
  // (docs/investigacion-diseno-2026-10.md §4.1).
  minSocialProof: 10,
};
