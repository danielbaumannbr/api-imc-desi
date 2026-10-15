/*const calcularIMC = require('../imc');
test('deve calcular IMC de uma pessoa com peso normal',
    () => {
        const resultado = calcularIMC(70, 1.75);
        expect(resultado.imc).toBe(22.86);
        expect(resultado.status).toBe('Peso normal');
    });
    */
   const calcularIMC = require('../imc'); test('deve calcular IMC de uma pessoa com peso normal', () => { const resultado = calcularIMC(70, 1.75); expect(resultado.imc).toBe(22.86); expect(resultado.status).toBe('Peso normal'); });