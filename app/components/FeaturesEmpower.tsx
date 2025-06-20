'use client';

export default function FeaturesEmpower() {
  const features = [
    {
      title: 'Record Anywhere',
      description: 'Use your browser. No app install required.',
      icon: '🎥'
    },
    {
      title: 'AI Legal Summary',
      description: 'Structured transcription + summarization.',
      icon: '🧠'
    },
    {
      title: 'Instant PDF Reports',
      description: 'Timestamped, geotagged, legally formatted.',
      icon: '📄'
    },
    {
      title: 'Secure Storage',
      description: 'With metadata + custom folders.',
      icon: '🔐'
    },
    {
      title: 'Custom Branding',
      description: 'For Pro users and organizations.',
      icon: '🖋️'
    }
  ];

  return (
    <section id="features" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Features That Empower
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
            Tools designed for real-world protection and documentation
          </p>
        </div>

        <div className="mt-12 grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-gray-50 rounded-lg p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-300"
            >
              <div className="text-4xl mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-500">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
