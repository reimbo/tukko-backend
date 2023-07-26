import dotenv from 'dotenv';
dotenv.config();


interface Inputs {
    title?: string;
    description?: string;
}

export const FeedbackForm = async (initialInputs: Inputs) => {
    const url = "https://gitlab.labranet.jamk.fi/api/v4/projects/23409/issues";
    const params = new URLSearchParams({
        title: initialInputs.title || "",
        description: initialInputs.description || "",
        labels: "Customer Feedback",
    });

    const token = process.env.ACCESS_TOKEN as string;

    const headers = {
        "Private-Token": token,
    };

    try {
        const response = await fetch(`${url}?${params}`, {
        method: "POST",
        headers: headers,
        });

        if (response.ok) {
        return response;
        } else {
        const error = await response.json();
        return error;
        }
    } catch (error: any) {
        console.log(`Error: ${error.message}`);
    }
};
