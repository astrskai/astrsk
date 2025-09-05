import { Page, SettingPageLevel, useAppStore } from "@/app/stores/app-store";
import { TypoXLarge } from "@/components-v2/typo";
import { ScrollArea, ScrollBar } from "@/components-v2/ui/scroll-area";
import { useClerk } from "@clerk/clerk-react";

const AccountPage = () => {
  const { signOut, user } = useClerk();
  const setSettingPageLevel = useAppStore.use.setSettingPageLevel();
  const setActivePage = useAppStore.use.setActivePage();

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto my-6 w-full max-w-[587px] pt-[80px]">
        <div className="mb-[54px] font-600 text-[24px] leading-[40px] text-text-body">
          Account and subscription
        </div>

        <div className="mb-12 flex flex-col gap-8 text-text-primary">
          <TypoXLarge className="font-semibold text-text-primary">
            Account
          </TypoXLarge>

          <div className="flex flex-row items-center gap-[8px]">
            <div className="size-[40px] rounded-full grid place-items-center overflow-hidden">
              {user?.hasImage ? (
                <div
                  className="w-full h-full bg-center bg-cover"
                  style={{ backgroundImage: `url('${user.imageUrl}')` }}
                ></div>
              ) : (
                <div className="w-full h-full bg-[url(/img/placeholder/avatar.png)] bg-center bg-size-[60px]" />
              )}
            </div>
            <div className="text-[14px] leading-[20px] font-[500] text-text-placeholder">
              {user?.primaryEmailAddress?.emailAddress}
            </div>
          </div>

          <button
            className="text-left py-[4px] text-status-destructive-light text-[16px] leading-[25.6px] font-[600]"
            onClick={() => {
              signOut();
              setSettingPageLevel(SettingPageLevel.main);
            }}
          >
            Sign out
          </button>
        </div>

        <div className="my-[40px] border-b border-border-dark" />

        <div className="mb-12 flex flex-col gap-8 text-text-primary">
          <TypoXLarge className="font-semibold text-text-primary">
            Subscription
          </TypoXLarge>

          <button
            className="text-left py-[4px] text-button-background-primary text-[16px] leading-[25.6px] font-[600]"
            onClick={() => {
              setActivePage(Page.Subscribe);
            }}
          >
            Subscribe to astrsk+
          </button>

          {/* TODO: subscription ongoing */}
        </div>
      </div>
      <ScrollBar orientation="vertical" className="w-1.5" />
    </ScrollArea>
  );
};

export { AccountPage };
