[**@waldiez/react v0.4.4**](../../README.md)

***

Defined in: src/waldiez/models/Stores/ISkillStore.ts:7

## Properties

### addSkill()

> **addSkill**: () => [`WaldiezNodeSkill`](../type-aliases/WaldiezNodeSkill.md)

Defined in: src/waldiez/models/Stores/ISkillStore.ts:10

#### Returns

[`WaldiezNodeSkill`](../type-aliases/WaldiezNodeSkill.md)

***

### cloneSkill()

> **cloneSkill**: (`id`) => `null` \| [`WaldiezNodeSkill`](../type-aliases/WaldiezNodeSkill.md)

Defined in: src/waldiez/models/Stores/ISkillStore.ts:11

#### Parameters

##### id

`string`

#### Returns

`null` \| [`WaldiezNodeSkill`](../type-aliases/WaldiezNodeSkill.md)

***

### deleteSkill()

> **deleteSkill**: (`id`) => `void`

Defined in: src/waldiez/models/Stores/ISkillStore.ts:13

#### Parameters

##### id

`string`

#### Returns

`void`

***

### exportSkill()

> **exportSkill**: (`skillId`, `hideSecrets`) => `object`

Defined in: src/waldiez/models/Stores/ISkillStore.ts:20

#### Parameters

##### skillId

`string`

##### hideSecrets

`boolean`

#### Returns

`object`

***

### getSkillById()

> **getSkillById**: (`id`) => `null` \| [`WaldiezNodeSkill`](../type-aliases/WaldiezNodeSkill.md)

Defined in: src/waldiez/models/Stores/ISkillStore.ts:9

#### Parameters

##### id

`string`

#### Returns

`null` \| [`WaldiezNodeSkill`](../type-aliases/WaldiezNodeSkill.md)

***

### getSkills()

> **getSkills**: () => [`WaldiezNodeSkill`](../type-aliases/WaldiezNodeSkill.md)[]

Defined in: src/waldiez/models/Stores/ISkillStore.ts:8

#### Returns

[`WaldiezNodeSkill`](../type-aliases/WaldiezNodeSkill.md)[]

***

### importSkill()

> **importSkill**: (`skill`, `skillId`, `position`, `save`) => [`WaldiezNodeSkill`](../type-aliases/WaldiezNodeSkill.md)

Defined in: src/waldiez/models/Stores/ISkillStore.ts:14

#### Parameters

##### skill

##### skillId

`string`

##### position

`undefined` | \{ `x`: `number`; `y`: `number`; \}

##### save

`boolean`

#### Returns

[`WaldiezNodeSkill`](../type-aliases/WaldiezNodeSkill.md)

***

### updateSkillData()

> **updateSkillData**: (`id`, `data`) => `void`

Defined in: src/waldiez/models/Stores/ISkillStore.ts:12

#### Parameters

##### id

`string`

##### data

`Partial`\<[`WaldiezNodeSkillData`](../type-aliases/WaldiezNodeSkillData.md)\>

#### Returns

`void`
