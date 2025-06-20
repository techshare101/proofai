'use client';

export default function WhoIsItFor() {
  const userGroups = [
    {
      icon: '🛠️',
      description: 'Construction workers logging change orders & safety issues'
    },
    {
      icon: '🚕',
      description: 'Gig workers and delivery staff documenting client disputes'
    },
    {
      icon: '⚖️',
      description: 'Legal professionals capturing witness statements'
    },
    {
      icon: '🎓',
      description: 'Students and researchers recording interviews'
    },
    {
      icon: '👩🏽‍🦱',
      description: 'Parents, tenants, and freelancers protecting their rights'
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Who Is It For?
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
            ProofAI serves those who need to document truth and protect their rights
          </p>
        </div>

        <div className="mt-10 max-w-4xl mx-auto">
          <ul className="space-y-4">
            {userGroups.map((group, index) => (
              <li key={index} className="bg-white p-4 rounded-lg shadow flex items-center">
                <div className="text-3xl mr-4">
                  {group.icon}
                </div>
                <div className="text-lg text-gray-700">
                  {group.description}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
