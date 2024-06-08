import React from "react";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main>
      <div className="w-full flex flex-col flex-wrap max-w-screen-xl mx-auto px-4 ">
        <img src="../public/myco_logo.svg"
        style={{
          padding : '10px',
          marginLeft : '20px',
          position :'absolute',
        }}
        />
        <div className="mt-4 mb-4">
          <p className="text-3xl font-bold-italic"></p>
        </div>
        {children}
      </div>
    </main>
  );
};
