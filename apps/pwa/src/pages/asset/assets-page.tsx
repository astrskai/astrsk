import { useState } from "react";
import { AssetsPageHeader, AssetType } from "@/features/asset/ui";
import { HelpVideoDialog, Loading } from "@/shared/ui";

/**
 * Assets page - displays Characters, Plots, and Flows in a unified view
 * Users can switch between asset types using tab navigation
 */
export function AssetsPage() {
  const [activeTab, setActiveTab] = useState<AssetType>("characters");
  const [keyword, setKeyword] = useState<string>("");
  const [isOpenHelpDialog, setIsOpenHelpDialog] = useState<boolean>(false);

  const handleImport = () => {
    // TODO: Implement import functionality
    console.log("Import clicked for:", activeTab);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Export clicked for:", activeTab);
  };

  const handleHelpClick = () => {
    setIsOpenHelpDialog(true);
  };

  return (
    <div className="bg-background-surface-2 flex h-full w-full flex-col">
      {/* Header */}
      <AssetsPageHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        keyword={keyword}
        onKeywordChange={setKeyword}
        onImportClick={handleImport}
        onExportClick={handleExport}
        onHelpClick={handleHelpClick}
      />

      <HelpVideoDialog
        open={isOpenHelpDialog}
        onOpenChange={setIsOpenHelpDialog}
        type={activeTab === "flows" ? "flows" : "cards"}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {/* TODO: Implement asset grids based on activeTab */}
        <div className="text-text-secondary flex h-full items-center justify-center">
          <div className="text-center">
            <h2 className="mb-2 text-xl font-semibold">
              {activeTab === "characters" && "Characters"}
              {activeTab === "plots" && "Plots"}
              {activeTab === "flows" && "Flows"}
            </h2>
            <p>Content will be implemented here</p>
          </div>
        </div>
      </div>
    </div>
  );
}
