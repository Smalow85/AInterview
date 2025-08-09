
import { useState } from "react";
import "./settings-dialog.scss";
import UserDashboard from "./UserDashboard";

export default function SettingsDialog() {
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div className="settings-dialog">
      <button className="action-button material-symbols-outlined"
        onClick={() => setOpen(!open)}>
        Settings
      </button>
      <dialog className="dialog" style={{ display: open ? "block" : "none" }}>
        <div className="dialog-container">
          <UserDashboard onClose={handleClose} />
        </div>
      </dialog>
    </div>
  );
}
