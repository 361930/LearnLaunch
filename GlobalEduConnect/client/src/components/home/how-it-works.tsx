const HowItWorks = () => {
  return (
    <section className="slide-in mb-16 bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        How GlobalEduConnect Works
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Step 1 */}
        <div className="flex flex-col items-center text-center">
          <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <span className="material-icons">person_add</span>
          </div>
          <h3 className="font-bold text-lg mb-2">Create Your Profile</h3>
          <p className="text-gray-600">
            Sign up as a student or apply to become a teacher. Complete your profile 
            to personalize your learning experience.
          </p>
        </div>
        
        {/* Step 2 */}
        <div className="flex flex-col items-center text-center">
          <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <span className="material-icons">search</span>
          </div>
          <h3 className="font-bold text-lg mb-2">Discover Classes</h3>
          <p className="text-gray-600">
            Browse upcoming classes by skill level, subject, or teacher. Find the perfect 
            educational content for your needs.
          </p>
        </div>
        
        {/* Step 3 */}
        <div className="flex flex-col items-center text-center">
          <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <span className="material-icons">groups</span>
          </div>
          <h3 className="font-bold text-lg mb-2">Connect & Learn</h3>
          <p className="text-gray-600">
            Join live classes, interact with teachers and peers worldwide, and expand 
            your knowledge in a global community.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
