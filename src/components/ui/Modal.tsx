import type { DrawerProps } from "./Drawer";

// ponytail: Modal is the centered preset of the native-<dialog> Drawer; one implementation, two entry points.
export { Modal } from "./Drawer";
export type ModalProps = Omit<DrawerProps, "side">;
