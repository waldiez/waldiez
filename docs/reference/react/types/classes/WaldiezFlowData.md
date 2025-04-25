[**@waldiez/react v0.4.4**](../../README.md)

***

Defined in: src/waldiez/models/Flow/FlowData.ts:41

Waldiez Flow Data

## Param

The nodes

## Param

The edges

## Param

The agents

## Param

The models

## Param

The skills

## Param

The chats

## Param

Is async

## Param

The cache seed

## Param

The viewport

## See

 - [WaldiezAgentUserProxy](WaldiezAgentUserProxy.md)
 - [WaldiezAgentAssistant](WaldiezAgentAssistant.md)
 - [WaldiezAgentGroupManager](WaldiezAgentGroupManager.md)
 - [WaldiezAgentRagUser](WaldiezAgentRagUser.md)
 - [WaldiezAgentSwarm](WaldiezAgentSwarm.md)
 - [WaldiezModel](WaldiezModel.md)
 - [WaldiezSkill](WaldiezSkill.md)
 - [WaldiezChat](WaldiezChat.md)
 - WaldiezFlowData

## Constructors

### Constructor

> **new WaldiezFlowData**(`props`): `WaldiezFlowData`

Defined in: src/waldiez/models/Flow/FlowData.ts:60

#### Parameters

##### props

###### agents

\{ `assistants`: [`WaldiezAgentAssistant`](WaldiezAgentAssistant.md)[]; `captain_agents`: [`WaldiezAgentCaptain`](WaldiezAgentCaptain.md)[]; `managers`: [`WaldiezAgentGroupManager`](WaldiezAgentGroupManager.md)[]; `rag_users`: [`WaldiezAgentRagUser`](WaldiezAgentRagUser.md)[]; `reasoning_agents`: [`WaldiezAgentReasoning`](WaldiezAgentReasoning.md)[]; `swarm_agents`: [`WaldiezAgentSwarm`](WaldiezAgentSwarm.md)[]; `users`: [`WaldiezAgentUserProxy`](WaldiezAgentUserProxy.md)[]; \}

###### agents.assistants

[`WaldiezAgentAssistant`](WaldiezAgentAssistant.md)[]

###### agents.captain_agents

[`WaldiezAgentCaptain`](WaldiezAgentCaptain.md)[]

###### agents.managers

[`WaldiezAgentGroupManager`](WaldiezAgentGroupManager.md)[]

###### agents.rag_users

[`WaldiezAgentRagUser`](WaldiezAgentRagUser.md)[]

###### agents.reasoning_agents

[`WaldiezAgentReasoning`](WaldiezAgentReasoning.md)[]

###### agents.swarm_agents

[`WaldiezAgentSwarm`](WaldiezAgentSwarm.md)[]

###### agents.users

[`WaldiezAgentUserProxy`](WaldiezAgentUserProxy.md)[]

###### cacheSeed?

`null` \| `number`

###### chats

[`WaldiezChat`](WaldiezChat.md)[]

###### edges

`Edge`[]

###### isAsync?

`boolean`

###### models

[`WaldiezModel`](WaldiezModel.md)[]

###### nodes

`Node`[]

###### skills

[`WaldiezSkill`](WaldiezSkill.md)[]

###### viewport

`Viewport`

#### Returns

`WaldiezFlowData`

## Properties

### agents

> **agents**: `object`

Defined in: src/waldiez/models/Flow/FlowData.ts:45

#### assistants

> **assistants**: [`WaldiezAgentAssistant`](WaldiezAgentAssistant.md)[]

#### captain\_agents

> **captain\_agents**: [`WaldiezAgentCaptain`](WaldiezAgentCaptain.md)[]

#### managers

> **managers**: [`WaldiezAgentGroupManager`](WaldiezAgentGroupManager.md)[]

#### rag\_users

> **rag\_users**: [`WaldiezAgentRagUser`](WaldiezAgentRagUser.md)[]

#### reasoning\_agents

> **reasoning\_agents**: [`WaldiezAgentReasoning`](WaldiezAgentReasoning.md)[]

#### swarm\_agents

> **swarm\_agents**: [`WaldiezAgentSwarm`](WaldiezAgentSwarm.md)[]

#### users

> **users**: [`WaldiezAgentUserProxy`](WaldiezAgentUserProxy.md)[]

***

### cacheSeed?

> `optional` **cacheSeed**: `null` \| `number` = `41`

Defined in: src/waldiez/models/Flow/FlowData.ts:58

***

### chats

> **chats**: [`WaldiezChat`](WaldiezChat.md)[]

Defined in: src/waldiez/models/Flow/FlowData.ts:56

***

### edges

> **edges**: `Edge`[]

Defined in: src/waldiez/models/Flow/FlowData.ts:43

***

### isAsync?

> `optional` **isAsync**: `boolean` = `false`

Defined in: src/waldiez/models/Flow/FlowData.ts:57

***

### models

> **models**: [`WaldiezModel`](WaldiezModel.md)[]

Defined in: src/waldiez/models/Flow/FlowData.ts:54

***

### nodes

> **nodes**: `Node`[]

Defined in: src/waldiez/models/Flow/FlowData.ts:42

***

### skills

> **skills**: [`WaldiezSkill`](WaldiezSkill.md)[]

Defined in: src/waldiez/models/Flow/FlowData.ts:55

***

### viewport

> **viewport**: `Viewport`

Defined in: src/waldiez/models/Flow/FlowData.ts:44
