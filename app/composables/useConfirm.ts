export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "default" | "danger" | "warning" | "info";
  showCloseButton?: boolean;
}

// 全局的确认对话框 ref
let confirmDialogRef: any = null;

export const setConfirmDialogRef = (ref: any) => {
  confirmDialogRef = ref;
};

export const useConfirm = () => {
  const showConfirm = (
    options: ConfirmOptions
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!confirmDialogRef) {
        console.warn("确认对话框组件未找到，请确保已在 app.vue 中引入");
        resolve(false);
        return;
      }

      confirmDialogRef.show({
        ...options,
        onConfirm: async () => {
          resolve(true);
        },
        onCancel: () => {
          resolve(false);
        },
      });
    });
  };

  return {
    showConfirm,
  };
};

