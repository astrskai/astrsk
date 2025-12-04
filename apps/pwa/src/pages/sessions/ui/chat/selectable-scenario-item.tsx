import { ScenarioMessageBox } from "./scenario-message-box";

interface SelectableScenarioItemProps {
  name: string;
  contents: string;
  active?: boolean;
  onClick?: () => void;
}

const SelectableScenarioItem = ({
  name,
  contents,
  active = false,
  onClick,
}: SelectableScenarioItemProps) => {
  return (
    <ScenarioMessageBox
      name={name}
      content={contents}
      active={active}
      onClick={onClick}
    />
  );
};

export default SelectableScenarioItem;
