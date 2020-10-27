import regexForFormat from '@/utils/regexForFormat'

describe('regexForFormat', () => {
  it('Allows MM format with other characters', () => {
      expect(regexForFormat('abc/MM').test('abc/01')).toBe(true)
  })

  it('Fails MM format with single digit', () => {
      expect(regexForFormat('abc/MM').test('abc/1')).toBe(false)
  })

  it('Allows M format with single digit', () => {
      expect(regexForFormat('M/abc').test('1/abc')).toBe(true)
  })

  it('Fails MM format when out of range', () => {
      expect(regexForFormat('M/abc').test('13/abc')).toBe(false)
  })

  it('Fails M format when out of range', () => {
      expect(regexForFormat('M/abc').test('55/abc')).toBe(false)
  })

  it('Replaces double digits before singles', () => {
      expect(regexForFormat('MMM').test('313131')).toBe(false)
  })

  it('Allows DD format with zero digit', () => {
      expect(regexForFormat('xyz/DD').test('xyz/01')).toBe(true)
  })

  it('Fails DD format with single digit', () => {
      expect(regexForFormat('xyz/DD').test('xyz/9')).toBe(false)
  })

  it('Allows D format with single digit', () => {
      expect(regexForFormat('xyz/D').test('xyz/9')).toBe(true)
  })

  it('Fails D format with out of range digit', () => {
      expect(regexForFormat('xyz/D').test('xyz/92')).toBe(false)
  })

  it('Fails DD format with out of range digit', () => {
      expect(regexForFormat('xyz/D').test('xyz/32')).toBe(false)
  })

  it('Allows YY format with double zeros', () => {
      expect(regexForFormat('YY').test('00')).toBe(true)
  })

  it('Fails YY format with four zeros', () => {
      expect(regexForFormat('YY').test('0000')).toBe(false)
  })

  it('Allows YYYY format with four zeros', () => {
      expect(regexForFormat('YYYY').test('0000')).toBe(true)
  })

  it('Allows MD-YY', () => {
      expect(regexForFormat('MD-YY').test('12-00')).toBe(true)
  })

  it('Allows DM-YY', () => {
      expect(regexForFormat('DM-YY').test('12-00')).toBe(true)
  })

  it('Allows date like MM/DD/YYYY', () => {
      expect(regexForFormat('MM/DD/YYYY').test('12/18/1987')).toBe(true)
  })

  it('Allows date like YYYY-MM-DD', () => {
      expect(regexForFormat('YYYY-MM-DD').test('1987-01-31')).toBe(true)
  })

  it('Fails date like YYYY-MM-DD with out of bounds day', () => {
      expect(regexForFormat('YYYY-MM-DD').test('1987-01-32')).toBe(false)
  })
})
