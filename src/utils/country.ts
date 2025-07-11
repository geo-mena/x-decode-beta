import * as countries from 'i18n-iso-countries'
import spanish from 'i18n-iso-countries/langs/es.json'

countries.registerLocale(spanish)

/**
 * Verifica si un código de país ISO 3166-1 alpha-3 es válido
 * @param code Código de país a validar
 * @returns Verdadero si el código es válido, falso en caso contrario
 */
export const isValidCountryCode = (code: string): boolean => {
    if (!code || typeof code !== 'string') return false

    // Códigos especiales
    if (code === 'XXX') return true
    if (code === 'PSP') return true // Soporte para pasaportes

    return code.length === 3 && countries.isValid(code)
}

/**
 * Obtiene el nombre del país a partir de su código ISO 3166-1 alpha-3
 * @param code Código de país
 * @returns Nombre del país en español o undefined si el código no es válido
 */
export const getCountryName = (code: string): string | undefined => {
    if (!isValidCountryCode(code)) return undefined

    // Manejar códigos especiales
    if (code === 'PSP') return 'Pasaporte'
    if (code === 'XXX') return 'Código especial'

    return countries.getName(code, 'es')
}

/**
 * Obtiene los códigos de países más usados en la aplicación
 * @returns Array de objetos con código y nombre de países
 */
export const getCommonCountryCodes = (): Array<{
    code: string
    name: string
}> => {
    const commonCodes = ['PSP', 'CHL', 'ARG', 'PER', 'COL', 'MEX', 'BRA', 'ECU']

    return commonCodes
        .filter((code) => isValidCountryCode(code))
        .map((code) => ({
            code,
            name: getCountryName(code) || code,
        }))
}

/**
 * Obtiene todos los países con sus nombres y códigos
 * @returns Array de objetos con código y nombre de todos los países
 */
export const getAllCountries = (): Array<{ code: string; name: string }> => {
    const allCodes = Object.keys(countries.getAlpha3Codes())

    // Agregar códigos especiales
    const specialCodes = ['PSP', 'XXX']
    const allCodesWithSpecial = [...specialCodes, ...allCodes]

    return allCodesWithSpecial
        .filter((code) => isValidCountryCode(code))
        .map((code) => ({
            code,
            name: getCountryName(code) || code,
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
}
