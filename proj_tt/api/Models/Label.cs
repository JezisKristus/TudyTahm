using System.ComponentModel.DataAnnotations;

namespace TT_API.Models
{
    public class Label
    {

        [Key]
        public int LabelID { get; set; }
        public string Color { get; set; }
        public string Name { get; set; }
    }
}
