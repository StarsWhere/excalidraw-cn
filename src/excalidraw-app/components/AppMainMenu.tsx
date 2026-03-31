import React from "react";
import MainMenu from "../../components/main-menu/MainMenu";
import { LanguageList } from "./LanguageList";

export const AppMainMenu: React.FC = React.memo(() => {
  return (
    <MainMenu>
      <MainMenu.DefaultItems.NewBoard />
      <MainMenu.DefaultItems.SwitchBoard />
      <MainMenu.DefaultItems.LoadScene />
      <MainMenu.DefaultItems.SaveToActiveFile />
      <MainMenu.DefaultItems.Export />
      <MainMenu.DefaultItems.SaveAsImage />
      <MainMenu.DefaultItems.Help />
      <MainMenu.DefaultItems.ClearCanvas />
      <MainMenu.Separator />
      <MainMenu.DefaultItems.ToggleTheme />
      <MainMenu.ItemCustom>
        <LanguageList style={{ width: "100%" }} />
      </MainMenu.ItemCustom>
      <MainMenu.DefaultItems.ChangeCanvasBackground />
    </MainMenu>
  );
});
