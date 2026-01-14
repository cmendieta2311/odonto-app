export function numberToSpanishWords(currentNumber: number): string {
    if (currentNumber === 0) return 'CERO';

    const unit = [
        '', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'
    ];
    const ten = [
        '', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'
    ];
    const maxTen = [
        'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'
    ];
    const hundred = [
        '', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'
    ];

    function convertGroup(n: number): string {
        let output = '';

        if (n === 100) {
            output = 'CIEN ';
        } else if (n > 100) {
            output = hundred[Math.floor(n / 100)] + ' ';
            n = n % 100;
        }

        if (n >= 10 && n <= 19) {
            output += maxTen[n - 10] + ' ';
        } else if (n >= 20) {
            output += ten[Math.floor(n / 10)] + ' ';
            if (n % 10 !== 0) {
                output += 'Y ' + unit[n % 10] + ' ';
            }
        } else {
            output += unit[n] + ' ';
        }

        return output;
    }

    let text = '';
    const millions = Math.floor(currentNumber / 1000000);
    const thousands = Math.floor((currentNumber % 1000000) / 1000);
    const units = currentNumber % 1000;

    if (millions > 0) {
        if (millions === 1) text += 'UN MILLON ';
        else text += convertGroup(millions) + 'MILLONES ';
    }

    if (thousands > 0) {
        if (thousands === 1) text += 'MIL ';
        else text += convertGroup(thousands) + 'MIL ';
    }

    if (units > 0) {
        text += convertGroup(units);
    }

    return text.trim() + ' GUARANIES';
}
