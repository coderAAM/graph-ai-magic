import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are a graph structure generator. Your task is to interpret user commands and generate graph data structures.

When the user asks for a graph, you MUST respond with ONLY a valid JSON object in this exact format:
{
  "nodes": [{"id": "unique_id", "label": "display_label"}, ...],
  "edges": [{"source": "node_id", "target": "node_id"}, ...],
  "message": "A friendly message describing what you created"
}

Rules:
1. Node IDs must be unique strings (use letters or numbers like "A", "B", "N1", "N2", etc.)
2. Edge source and target must reference existing node IDs
3. Always include a helpful message describing the graph you created
4. DO NOT include any text before or after the JSON object
5. DO NOT use markdown code blocks
6. When the user specifies names for nodes (like person names: Ahmed, Ali, Usman), use those names as labels

Graph types you can create:
- Binary trees: nodes with left/right children
- Linked lists: linear chain of nodes
- Mutex/lock graphs: processes competing for resources
- Random graphs: nodes with random connections
- Cycle graphs: circular connections
- State machines: states with labeled transitions
- DAGs (Directed Acyclic Graphs): no cycles
- Complete graphs: every node connected to every other
- Bipartite graphs: two sets of nodes with connections between sets
- Star graphs: central node connected to all others
- Friendship/social networks: people connected by relationships

For equations like "y = x^2", create nodes for x values and edges showing relationships.
Be creative but accurate with your graph interpretations.`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { command } = await req.json();
    
    if (!command) {
      return new Response(
        JSON.stringify({ error: 'Command is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Received command:', command);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: command }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add more credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to generate graph' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data));

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return new Response(
        JSON.stringify({ error: 'No response from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try to parse the JSON response
    let graphData;
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();
      
      graphData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse graph data',
          raw: content 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate the response structure
    if (!graphData.nodes || !Array.isArray(graphData.nodes)) {
      graphData.nodes = [];
    }
    if (!graphData.edges || !Array.isArray(graphData.edges)) {
      graphData.edges = [];
    }
    if (!graphData.message) {
      graphData.message = 'Graph generated successfully!';
    }

    console.log('Returning graph data:', JSON.stringify(graphData));

    return new Response(
      JSON.stringify(graphData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-graph function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
