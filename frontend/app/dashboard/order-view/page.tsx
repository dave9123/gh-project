export default function OrderViewPage() {
  return (
    <main className="flex flex-col items-center justify-center w-screen">
      <section className="flex justify-center w-full">
        <div className="hidden flex-col justify-center items-center w-full 2xl:flex">
          <div className="grid grid-cols-2 w-full h-full">
            <div className="w-full h-full border-divider-r"></div>
            <div className="w-full h-full"></div>
          </div>
          <div className="grid grid-cols-2 w-full h-full border-divider-y">
            <div className="w-full h-full border-divider-r"></div>
            <div className="w-full h-full"></div>
          </div>
        </div>
        <header className="flex flex-col items-center 2xl:min-w-[1522px]  min-w-full px-3 2xl:px-0 dark:bg-zinc-950 bg-zinc-50">
          <section className="flex flex-col gap-5 px-5 py-5 w-full text-left sm:py-10 border-divider-x sm:gap-5">
            <div className="flex justify-between items-center">
              <a
                className="flex gap-2 items-center transition-all duration-300 text-md text-zinc-500 hover:dark:text-white hover:text-black active"
                href="/id"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="size-4"
                >
                  <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="m15 18-6-6 6-6"
                  ></path>
                </svg>
                Home
              </a>
            </div>
            <div className="flex flex-col gap-3 w-full sm:gap-5">
              <h1 className="w-full text-4xl font-semibold tracking-tight leading-tight md:text-5xl">
                Pesanan Baru
              </h1>
            </div>
          </section>
        </header>
        <div className="hidden flex-col justify-center items-center w-full 2xl:flex">
          <div className="grid grid-cols-2 w-full h-full">
            <div className="w-full h-full border-divider-r"></div>
            <div className="w-full h-full"></div>
          </div>
          <div className="grid grid-cols-2 w-full h-full border-divider-y">
            <div className="w-full h-full border-divider-r"></div>
            <div className="w-full h-full"></div>
          </div>
        </div>
      </section>
    </main>
  );
}
