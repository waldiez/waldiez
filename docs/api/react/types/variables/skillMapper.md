[**@waldiez/react v0.4.4**](../../README.md)

***

> `const` **skillMapper**: `object`

Defined in: src/waldiez/models/mappers/skill/skillMapper.ts:25

## Type declaration

### asNode()

> **asNode**: (`skill`, `position?`) => [`WaldiezNodeSkill`](../type-aliases/WaldiezNodeSkill.md)

#### Parameters

##### skill

[`WaldiezSkill`](../classes/WaldiezSkill.md)

##### position?

###### x

`number`

###### y

`number`

#### Returns

[`WaldiezNodeSkill`](../type-aliases/WaldiezNodeSkill.md)

### exportSkill()

> **exportSkill**: (`skillNode`, `replaceSecrets`) => `object`

#### Parameters

##### skillNode

[`WaldiezNodeSkill`](../type-aliases/WaldiezNodeSkill.md)

##### replaceSecrets

`boolean`

#### Returns

`object`

### importSkill()

> **importSkill**: (`json`) => [`WaldiezSkill`](../classes/WaldiezSkill.md)

#### Parameters

##### json

`unknown`

#### Returns

[`WaldiezSkill`](../classes/WaldiezSkill.md)
