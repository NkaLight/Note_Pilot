/** About React Component
 * @description This component serves as the about page for Note Pilot.
 * @returns {JSX.Element} The rendered component
 */
export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-10 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
      <div className="bg-white/80 backdrop-blur text-center p-8 rounded-2xl shadow-lg max-w-2xl border border-gray-300">
          <p className="text-3xl font-bold mb-4 text-blue-600">NotePilot was created by a team of five people for a software engineering project.
          Over the time we have spent working on it, we have
             developed many useful features to help people study better! Be sure to check out our repo
             for a more in depth guide.</p>
        </div>
      </main>
    </div>
  );
}