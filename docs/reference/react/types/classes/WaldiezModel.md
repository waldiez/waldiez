[**@waldiez/react v0.4.4**](../../README.md)

***

Defined in: src/waldiez/models/Model/Model.ts:22

Waldiez Model

## Param

The type (model)

## Param

The ID

## Param

The name of the model

## Param

The description of the model

## Param

The tags

## Param

The requirements

## Param

The created at date

## Param

The updated at date

## Param

The data

## Param

Any additional properties

## See

[WaldiezModelData](WaldiezModelData.md)

## Constructors

### Constructor

> **new WaldiezModel**(`props`): `WaldiezModel`

Defined in: src/waldiez/models/Model/Model.ts:34

#### Parameters

##### props

###### createdAt

`string`

###### data

[`WaldiezModelData`](WaldiezModelData.md)

###### description

`string`

###### id

`string`

###### name

`string`

###### requirements

`string`[]

###### rest?

\{[`key`: `string`]: `unknown`; \}

###### tags

`string`[]

###### updatedAt

`string`

#### Returns

`WaldiezModel`

## Properties

### createdAt

> **createdAt**: `string`

Defined in: src/waldiez/models/Model/Model.ts:29

***

### data

> **data**: [`WaldiezModelData`](WaldiezModelData.md)

Defined in: src/waldiez/models/Model/Model.ts:31

***

### description

> **description**: `string`

Defined in: src/waldiez/models/Model/Model.ts:26

***

### id

> **id**: `string`

Defined in: src/waldiez/models/Model/Model.ts:24

***

### name

> **name**: `string`

Defined in: src/waldiez/models/Model/Model.ts:25

***

### requirements

> **requirements**: `string`[]

Defined in: src/waldiez/models/Model/Model.ts:28

***

### rest?

> `optional` **rest**: `object` = `{}`

Defined in: src/waldiez/models/Model/Model.ts:32

#### Index Signature

\[`key`: `string`\]: `unknown`

***

### tags

> **tags**: `string`[]

Defined in: src/waldiez/models/Model/Model.ts:27

***

### type

> **type**: `string` = `"model"`

Defined in: src/waldiez/models/Model/Model.ts:23

***

### updatedAt

> **updatedAt**: `string`

Defined in: src/waldiez/models/Model/Model.ts:30

## Methods

### create()

> `static` **create**(): `WaldiezModel`

Defined in: src/waldiez/models/Model/Model.ts:56

#### Returns

`WaldiezModel`
