import { PromptMessage, PlainPromptMessage, HistoryPromptMessage, parsePromptMessage, HistoryType, PromptMessageType } from "@/modules/agent/domain";
import { PromptBlockType } from "@/shared/prompt/domain";
import { UniqueEntityID } from "@/shared/domain";
import { PromptItem } from "./prompt-panel-types";

/**
 * Convert agent's PromptMessage array to UI-friendly PromptItem array
 */
export function convertPromptMessagesToItems(promptMessages: PromptMessage[]): PromptItem[] {
  return promptMessages.map((msg): PromptItem => {
    if (msg instanceof PlainPromptMessage) {
      // Extract content from prompt blocks
      const content = msg.promptBlocks
        .map(block => {
          // Check if this is a PlainBlock with template property
          if ('template' in block && block.template) {
            return block.template;
          }
          // Fallback to content property if available
          if ('content' in block) {
            return block.content || '';
          }
          return '';
        })
        .join('\n');
      
      // Try to use the first block's name as the label, or a combination of block names
      let label = `Message ${msg.id.toString().slice(0, 8)}`;
      if (msg.promptBlocks.length > 0) {
        // Get names from blocks that have them
        const blockNames = msg.promptBlocks
          .filter(block => 'name' in block && block.name)
          .map(block => block.name);
        
        if (blockNames.length > 0) {
          // Use first block name or combine multiple
          label = blockNames.length === 1 ? blockNames[0] : blockNames.join(' + ');
        }
      }
      
      return {
        id: msg.id.toString(),
        label,
        enabled: msg.props.enabled ?? true,
        content,
        role: msg.role,
        type: "regular",
      };
    } else if (msg instanceof HistoryPromptMessage) {
      // For history messages, extract content similarly
      const userBlocks = msg.userPromptBlocks || [];
      const assistantBlocks = msg.assistantPromptBlocks || [];
      const allBlocks = [...userBlocks, ...assistantBlocks];
      
      const content = allBlocks
        .map(block => {
          // Check if this is a PlainBlock with template property
          if ('template' in block && block.template) {
            return block.template;
          }
          // Fallback to content property if available
          if ('content' in block) {
            return block.content || '';
          }
          return '';
        })
        .join('\n');
      
      // Create a more descriptive label for history messages
      let label = `History`;
      if (msg.start !== undefined && msg.end !== undefined) {
        const fromEnd = msg.countFromEnd !== false;
        if (fromEnd) {
          label = `History (last ${msg.end - msg.start} messages)`;
        } else {
          label = `History (messages ${msg.start}-${msg.end})`;
        }
      }
      
      return {
        id: msg.id.toString(),
        label,
        enabled: msg.props.enabled ?? true,
        content,
        role: "assistant", // History messages are typically assistant role
        type: "history",
        start: msg.start,
        end: msg.end,
        countFromEnd: msg.countFromEnd,
      };
    }
    
    // Fallback for unknown message types
    return {
      id: (msg as any).id?.toString() || new UniqueEntityID().toString(),
      label: `Message`,
      enabled: true,
      content: "",
      role: "system",
      type: "regular",
    };
  });
}

/**
 * Convert UI PromptItem array to agent's PromptMessage format
 */
export function convertItemsToPromptMessages(items: PromptItem[]): PromptMessage[] {
  return items.map(item => {
    let messageData: any;
    
    if (item.type === "history") {
      messageData = {
        id: item.id,
        type: PromptMessageType.History,
        enabled: item.enabled,
        historyType: HistoryType.Split,
        start: item.start || 0,
        end: item.end || 8,
        countFromEnd: item.countFromEnd ?? true,
        createdAt: new Date().toISOString(),
        userPromptBlocks: [{
          id: new UniqueEntityID().toString(),
          type: PromptBlockType.Plain,
          name: item.label,
          template: item.content,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }],
        assistantPromptBlocks: [],
      };
    } else {
      // Regular message
      messageData = {
        id: item.id,
        type: PromptMessageType.Plain,
        enabled: item.enabled,
        role: item.role,
        createdAt: new Date().toISOString(),
        promptBlocks: [{
          id: new UniqueEntityID().toString(),
          type: PromptBlockType.Plain,
          name: item.label, // Use the label as the block name
          template: item.content, // Store content as template
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }],
      };
    }
    
    // Parse the JSON data into proper domain objects
    const result = parsePromptMessage(messageData);
    if (result.isFailure) {
      console.error("Failed to parse prompt message:", result.getError());
      throw new Error(`Failed to parse prompt message: ${result.getError()}`);
    }
    
    return result.getValue();
  });
}