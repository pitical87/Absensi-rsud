type StepperProps = {
  currentStep: number;
  steps: string[];
};

export default function StepWizard({ currentStep, steps }: StepperProps) {
  return (
    <div className="flex items-center justify-between w-full">
      {steps.map((step, index) => (
        <div key={step} className="relative flex flex-1 flex-col items-center">
          {/* Garis */}
          {index < steps.length - 1 && (
            <div
              className={`absolute top-5 left-1/2 h-0.5 w-full
              ${index < currentStep ? "bg-blue-600" : "bg-gray-300"}`}
            />
          )}

          {/* Lingkaran */}
          <div
            className={`
              z-10 flex h-10 w-10 items-center justify-center rounded-full border-2
              transition-all duration-300
              ${
                index < currentStep
                  ? "border-blue-600 bg-blue-600"
                  : index === currentStep
                    ? "border-blue-600 bg-white"
                    : "border-gray-300 bg-white"
              }
            `}
          />

          {/* Label */}
          <span
            className={`mt-2 text-sm
              ${index <= currentStep ? "text-blue-600" : "text-gray-400"}
            `}>
            {step}
          </span>
        </div>
      ))}
    </div>
  );
}
