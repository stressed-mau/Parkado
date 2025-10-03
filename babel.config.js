module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        // 1. Mueve el preset de Expo aquí
        'babel-preset-expo',
        {
          // 2. Añade esta opción para que el JSX sepa usar NativeWind
          jsxImportSource: 'nativewind', 
        },
      ],
      // 3. Mueve 'nativewind/babel' aquí, al final de los presets
      'nativewind/babel',
    ],
    // 4. Deja el array de plugins vacío (o añade otros plugins, NO nativewind)
    plugins: [
        // Si no tienes otros plugins (como Reanimated), puedes dejar este array vacío.
    ],
  };
};