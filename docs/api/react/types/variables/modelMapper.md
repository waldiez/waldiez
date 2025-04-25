[**@waldiez/react v0.4.4**](../../README.md)

***

> `const` **modelMapper**: `object`

Defined in: src/waldiez/models/mappers/model/modelMapper.ts:25

## Type declaration

### asNode()

> **asNode**: (`model`, `position?`) => [`WaldiezNodeModel`](../type-aliases/WaldiezNodeModel.md)

#### Parameters

##### model

[`WaldiezModel`](../classes/WaldiezModel.md)

##### position?

###### x

`number`

###### y

`number`

#### Returns

[`WaldiezNodeModel`](../type-aliases/WaldiezNodeModel.md)

### exportModel()

> **exportModel**: (`modelNode`, `replaceSecrets`) => `object`

#### Parameters

##### modelNode

[`WaldiezNodeModel`](../type-aliases/WaldiezNodeModel.md)

##### replaceSecrets

`boolean`

#### Returns

`object`

##### createdAt

> **createdAt**: `string` = `modelNode.data.createdAt`

##### data

> **data**: `object`

###### data.apiKey

> **apiKey**: `null` \| `string`

###### data.apiType

> **apiType**: [`WaldiezModelAPIType`](../type-aliases/WaldiezModelAPIType.md) = `modelNode.data.apiType`

###### data.apiVersion

> **apiVersion**: `null` \| `string` = `modelNode.data.apiVersion`

###### data.baseUrl

> **baseUrl**: `null` \| `string` = `modelNode.data.baseUrl`

###### data.defaultHeaders

> **defaultHeaders**: `object`

###### Index Signature

\[`key`: `string`\]: `string`

###### data.maxTokens

> **maxTokens**: `null` \| `number` = `modelNode.data.maxTokens`

###### data.price

> **price**: [`WaldiezModelPrice`](../type-aliases/WaldiezModelPrice.md) = `modelNode.data.price`

###### data.temperature

> **temperature**: `null` \| `number` = `modelNode.data.temperature`

###### data.topP

> **topP**: `null` \| `number` = `modelNode.data.topP`

##### description

> **description**: `string` = `modelNode.data.description`

##### id

> **id**: `string` = `modelNode.id`

##### name

> **name**: `string` = `modelNode.data.label`

##### requirements

> **requirements**: `string`[] = `modelNode.data.requirements`

##### tags

> **tags**: `string`[] = `modelNode.data.tags`

##### type

> **type**: `string` = `"model"`

##### updatedAt

> **updatedAt**: `string` = `modelNode.data.updatedAt`

### importModel()

> **importModel**: (`json`) => [`WaldiezModel`](../classes/WaldiezModel.md)

#### Parameters

##### json

`unknown`

#### Returns

[`WaldiezModel`](../classes/WaldiezModel.md)
