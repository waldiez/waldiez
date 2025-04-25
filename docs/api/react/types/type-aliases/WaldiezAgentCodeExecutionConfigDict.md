[**@waldiez/react v0.4.4**](../../README.md)

***

> **WaldiezAgentCodeExecutionConfigDict** = `object`

Defined in: src/waldiez/models/Agent/Common/types.ts:17

Code execution configuration.

## Param

The working directory

## Param

Either boolean (to enable/disable) or string (to specify the images)

## Param

The timeout

## Param

The last N messages

## Param

The functions (skill ids) to use

## Properties

### functions?

> `optional` **functions**: `string`[]

Defined in: src/waldiez/models/Agent/Common/types.ts:22

***

### lastNMessages?

> `optional` **lastNMessages**: `number` \| `"auto"`

Defined in: src/waldiez/models/Agent/Common/types.ts:21

***

### timeout?

> `optional` **timeout**: `number`

Defined in: src/waldiez/models/Agent/Common/types.ts:20

***

### useDocker?

> `optional` **useDocker**: `string` \| `string`[] \| `boolean`

Defined in: src/waldiez/models/Agent/Common/types.ts:19

***

### workDir?

> `optional` **workDir**: `string`

Defined in: src/waldiez/models/Agent/Common/types.ts:18
