export default function AccountPage() {
  return (
    <div
      className="w-full max-w-3xl mx-auto space-y-10"
      data-layout-boundary="account-content"
    >
      <h1 className="text-4xl font-bold tracking-tight mb-4">
        Account Settings
      </h1>

      <AccountForm />
    </div>
  );
}

import AccountForm from "./AccountForm";
