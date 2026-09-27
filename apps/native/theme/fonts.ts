/**
 * Font-family name constants for React Native screens.
 *
 * @expo-google-fonts/lora and @expo-google-fonts/montserrat export each weight
 * under a `<Family>_<weight><Style>` name (e.g. `Lora_400Regular`), and the
 * loaded font registers in RN's font registry under that *same* string. So a
 * screen passes `useFonts({ Lora_400Regular, ... })` and then styles with
 * `fontFamily: 'Lora_400Regular'` — the two must match exactly.
 *
 * These constants are that single source of truth: import them both for the
 * `useFonts` map and for `fontFamily` so a typo can't drift the two apart.
 *
 * The shared `type` tokens in @meals_client/core carry CSS font stacks
 * ("'Lora', 'Georgia', serif") which RN's StyleSheet cannot consume — RN takes a
 * single registered family name, not a fallback stack. So the *names* live here;
 * the role mapping (display = Lora, body = Montserrat) mirrors `type` in core.
 */

export const fontFamilies = {
  loraRegular: 'Lora_400Regular',
  loraMedium: 'Lora_500Medium',
  loraSemiBold: 'Lora_600SemiBold',
  loraBold: 'Lora_700Bold',
  montserratRegular: 'Montserrat_400Regular',
  montserratMedium: 'Montserrat_500Medium',
  montserratSemiBold: 'Montserrat_600SemiBold',
  montserratBold: 'Montserrat_700Bold',
} as const;

export type FontFamilyKey = keyof typeof fontFamilies;
export type FontFamilyName = (typeof fontFamilies)[FontFamilyKey];

/**
 * Role-based families mirroring core's `type.fontDisplay` / `type.fontBody`.
 * Screens reference these so the Lora/Montserrat choice stays in one place.
 */
export const fontRoles = {
  /** Headings — core `type.fontDisplay` (Lora). */
  display: fontFamilies.loraRegular,
  displayMedium: fontFamilies.loraMedium,
  displaySemiBold: fontFamilies.loraSemiBold,
  displayBold: fontFamilies.loraBold,
  /** Body text — core `type.fontBody` (Montserrat). */
  body: fontFamilies.montserratRegular,
  bodyMedium: fontFamilies.montserratMedium,
  bodySemiBold: fontFamilies.montserratSemiBold,
  bodyBold: fontFamilies.montserratBold,
} as const;

export type FontRole = keyof typeof fontRoles;
