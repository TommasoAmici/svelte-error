/**
 * The AppNavBar component requires the MenuItem component.
 * Since Svelte is not capable of handling this, we create a small "bundle"
 * that includes all the necessary parts.
 *
 * https://github.com/sveltejs/svelte/issues/3594
 */
import MenuItem from "../shared/MenuItem.svelte";
import AppNavBar from "./AppNavBar.svelte";

export default {
  MenuItem,
  AppNavBar,
};
