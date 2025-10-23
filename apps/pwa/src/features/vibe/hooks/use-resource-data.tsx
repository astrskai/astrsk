import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cardQueries } from '@/app/queries/card/query-factory';
import { flowQueries } from '@/app/queries/flow/query-factory';
import { CardType } from '@/modules/card/domain';
import { CardDrizzleMapper } from '@/modules/card/mappers/card-drizzle-mapper';
import { FlowDrizzleMapper } from '@/modules/flow/mappers/flow-drizzle-mapper';
import { useFlowData } from './use-flow-data';
import { filterEditableResourceFields } from '../utils/filter-editable-fields';

interface UseResourceDataProps {
  selectedCardId: string | null;
  selectedFlowId: string | null;
  isCardPage: boolean;
  isFlowPage: boolean;
}

/**
 * Hook to load and prepare resource data (card or flow) for editing
 */
export function useResourceData({
  selectedCardId,
  selectedFlowId,
  isCardPage,
  isFlowPage,
}: UseResourceDataProps) {
  // Load card data
  const { data: selectedCard } = useQuery({
    ...cardQueries.detail(selectedCardId || ''),
    enabled: !!selectedCardId && isCardPage,
  });

  // Load flow data
  const { data: selectedFlow } = useQuery({
    ...flowQueries.detail(selectedFlowId || ''),
    enabled: !!selectedFlowId && isFlowPage,
  });

  // Load flow-related data (agents, if-nodes, data-store nodes)
  const { agents, ifNodes, dataStoreNodes } = useFlowData(selectedFlowId, selectedFlow || null);

  // Prepare resource data for backend
  const resourceData = useMemo(() => {
    let resourceType: 'character_card' | 'plot_card' | 'flow' | null = null;
    let resourceName = '';
    let fullResourceData = null;
    let editableData = null;

    if (isCardPage && selectedCard) {
      resourceType = selectedCard.props.type === CardType.Character ? 'character_card' : 'plot_card';
      resourceName = selectedCard.props.type === CardType.Character 
        ? (selectedCard.props as any).name || 'Unnamed Character'
        : (selectedCard.props as any).title || 'Unnamed Plot';
      
      // Convert card to persistence format
      const persistenceData = CardDrizzleMapper.toPersistence(selectedCard);
      fullResourceData = persistenceData;
      
      // Get editable fields
      editableData = filterEditableResourceFields(resourceType, persistenceData);
      
      // Card data prepared
    } else if (isFlowPage && selectedFlow) {
      resourceType = 'flow';
      resourceName = selectedFlow.props.name || 'Unnamed Flow';
      
      // Convert flow to persistence format and include all node data
      const flowPersistence = FlowDrizzleMapper.toPersistence(selectedFlow);
      
      // Combine flow data with agents, if-nodes, and data-store nodes
      fullResourceData = {
        ...flowPersistence,
        agents: agents,
        ifNodes: ifNodes,
        dataStoreNodes: dataStoreNodes
      };
      
      // Get editable fields
      editableData = filterEditableResourceFields(resourceType, fullResourceData);
      
      // Flow data prepared
    }

    return {
      resourceType,
      resourceName,
      fullResourceData,
      editableData,
      selectedCard,
      selectedFlow,
    };
  }, [isCardPage, isFlowPage, selectedCard, selectedFlow, agents, ifNodes, dataStoreNodes]);

  return resourceData;
}