import PathRegistry from '@/PathRegistry'

describe('PathRegistry', () => {
    test('subset structure', () => {
        const registry = new PathRegistry()

        const paths = path => Array.from(registry.getSubset(path).paths())

        registry.add('name', null)
        registry.add('address', [])
        registry.add('address[0]', {})
        registry.add('address[0].street', 'Baker Street')
        registry.add('address[0].building', '221b')
        registry.add('address[1]', {})
        registry.add('address[1].street', '')
        registry.add('address[1].building', '')

        expect(paths('name')).toEqual(['name'])
        expect(paths('address')).toEqual([
            'address',
            'address[0]',
            'address[0].street',
            'address[0].building',
            'address[1]',
            'address[1].street',
            'address[1].building',
        ])
        expect(paths('address[1]')).toEqual([
            'address[1]',
            'address[1].street',
            'address[1].building',
        ])

        registry.remove('address[1]')

        expect(paths('address')).toEqual([
            'address',
            'address[0]',
            'address[0].street',
            'address[0].building',
            'address[1].street',
            'address[1].building',
        ])

        expect(paths('address[1]')).toEqual([
            'address[1].street',
            'address[1].building',
        ])
    })
})
