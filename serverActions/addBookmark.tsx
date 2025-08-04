
// import { createClient } from "@/utils/supabase/server"
// import urlMetadata from "url-metadata"

type data = {
    categories: string,
    labels: [] | labelData[],
    link: string,
    email?: string,
    user_id?: string,
    bearerToken?: string | undefined
}
type labelData = {
    id: string,
    text: string
}

export async function sendData(formData: data): Promise<{ status: number, statusText: string }> {
    try {
        console.log('Received data - add bookmarks', formData);

        const { createClient } = await import('@supabase/supabase-js');

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${formData.bearerToken || ""}`,
                    },
                },
            }
        );

        let metadata = "Untitled";
        try {
            const response = await fetch(formData.link, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; bookmark-fetcher/1.0)'
                }
            });

            if (response.ok) {
                const html = await response.text();
                const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
                if (titleMatch && titleMatch[1]) {
                    metadata = titleMatch[1].trim();
                }
            }
        } catch (e) {
            console.log('Error fetching metadata:', e);
        }

        const { data, error } = await supabase
            .from('bookmarks')
            .insert({
                user_id: formData?.user_id,
                email: formData?.email,
                categories: formData.categories,
                labels: formData.labels,
                link: formData.link,
                metadata: metadata
            })
            .select();

        if (error) {
            console.error('Supabase error:', error);
            return { status: 500, statusText: error.message };
        }

        console.log('Added bookmark:', data);
        return { status: 201, statusText: "Bookmark added successfully" };

    } catch (error) {
        console.error('Error in sendData:', error, formData);
        return {
            status: 500,
            statusText: error instanceof Error ? error.message : "Internal server error"
        };
    }
}