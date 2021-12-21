import { html } from "lit";
import { AppNavBar as component } from "..";
import { menu } from "./menu";

export default {
  component: component.name,
};

export const AppNavBar = ({ active = "parent", open = true }) => {
  return html`<app-nav-bar
    .active=${active}
    .open=${open}
    .menu=${JSON.stringify(menu)}
  ></app-nav-bar>`;
};

AppNavBar.storyName = "app-nav-bar";
AppNavBar.parameters = {
  docs: {
    page: readme,
  },
  layout: "fullscreen",
};
